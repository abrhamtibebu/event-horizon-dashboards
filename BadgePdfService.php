<?php

namespace App\Services;

use App\Models\Attendee;
use App\Models\Event;
use App\Models\FormSubmission;
use App\Models\BadgeTemplate;
use App\Models\Order;
use App\Services\BadgeMappingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\ErrorCorrectionLevel;

class BadgePdfService
{
    /** Active layout for registration / download badges. Use BADGE_LAYOUT_TICKET for landscape ticket design. */
    private const BADGE_LAYOUT_A6 = 'a6';

    private const BADGE_LAYOUT_TICKET = 'ticket';

    /** Bump when badge PDF layout changes so caches and stored copies regenerate. */
    public const BADGE_RENDER_REVISION = 'a6-v14';

    private const LOGO_HEIGHT_MM = 10.0;

    /** Max embedded logo pixels — keeps DomPDF memory usage stable. */
    private const BADGE_LOGO_MAX_PIXEL_HEIGHT = 120;

    private const BADGE_LOGO_MAX_PIXEL_WIDTH = 360;

    /** Do not decode larger source images into memory (e.g. multi‑megapixel uploads). */
    private const BADGE_LOGO_MAX_SOURCE_PIXELS = 10_000_000;

    protected BadgeMappingService $badgeMappingService;

    public function __construct(BadgeMappingService $badgeMappingService)
    {
        $this->badgeMappingService = $badgeMappingService;
    }

    public function generateBadgePdf(Attendee $attendee, Event $event): string
    {
        try {
            [$originalTimeLimit, $originalMemoryLimit] = $this->beginBadgePdfGeneration();

            // Check if GD extension is available for PDF generation
            if (!extension_loaded('gd')) {
                Log::info('GD extension not available, generating text-based badge');
                $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

                return $this->generateTextBasedBadge($attendee, $event);
            }

            $guest = $attendee->guest;
            $guestType = $attendee->guestType;

            // Try to get official badge template for the event
            $badgeTemplate = BadgeTemplate::where('event_id', $event->id)
                ->where('status', 'official')
                ->first();

            // If official template exists, log it for future enhancement
            // Full custom template rendering would require HTML generation from template_json
            // For now, we use the standard badge generation which matches the frontend
            if ($badgeTemplate && !empty($badgeTemplate->template_json)) {
                Log::info('Official badge template found for event (using standard generation)', [
                    'event_id' => $event->id,
                    'template_id' => $badgeTemplate->id,
                    'template_name' => $badgeTemplate->name
                ]);
                // Note: Custom template rendering from badge designer would be implemented here
                // This requires parsing template_json and generating HTML accordingly
            }

            // Generate QR code data - Use only guest UUID (12 digits) for consistency with admin panel
            $qrData = $this->generateSimpleQrData($attendee, $event);

            // Generate QR code image with timeout protection
            $qrPixelSize = $this->getBadgeQrPixelSize();
            $qrCodeImage = $this->generateQrCodeImage($qrData, $qrPixelSize);

            // Prepare badge data - UNIFIED with frontend badge generation
            $confirmationCode = 'REG-' . str_pad($attendee->id, 8, '0', STR_PAD_LEFT);
            $badgeData = [
                'name' => $guest->name ?? '',
                'company' => $guest->company ?? '',
                'jobTitle' => $guest->jobtitle ?? '',
                'country' => $guest->country ?? '',
                'guestType' => $guestType ? $guestType->name : 'Visitor',
                'qrData' => $qrData,
                'qrCodeImage' => $qrCodeImage,
                'eventName' => $event->name,
                'eventDate' => $event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('F j, Y') : '',
                'eventDateDisplay' => $this->formatEventDatesForBadge($event),
                'eventLocation' => $event->location ?? '',
                'badgeId' => $confirmationCode,
                'confirmationCode' => $confirmationCode,
                'attendeeId' => $attendee->id,
                'uuid' => substr($guest->uuid ?? $guest->id ?? '', 0, 12), // Add UUID for consistency (first 12 chars)
                'qrValue' => $this->getQrValue($attendee, $event), // Unified QR value
            ];

            $badgeData = $this->appendBrandingToBadgeData($badgeData, $event);

            // Generate HTML for the badge
            $html = $this->generateBadgeHtml($badgeData);

            $pdf = Pdf::loadHTML($html);
            $this->configureBadgePdf($pdf);

            $pdfOutput = $pdf->output();

            $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

            return $pdfOutput;

        } catch (\Exception $e) {
            $this->endBadgePdfGeneration($originalTimeLimit ?? null, $originalMemoryLimit ?? null);

            Log::error('BadgePdfService: Failed to generate PDF', [
                'attendee_id' => $attendee->id,
                'event_id' => $event->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception('PDF generation failed: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Order-level purchase pass PDF — same A6 e-badge design plus holder details page.
     */
    public function generateOrderPassPdf(Order $order, bool $includeHoldersPage = true): string
    {
        if (! extension_loaded('gd')) {
            Log::warning('BadgePdfService: GD missing — generating minimal order pass PDF');

            return $this->generateMinimalOrderPassPdf($order);
        }

        try {
            return $this->renderOrderPassA6Once($order, $includeHoldersPage);
        } catch (\Throwable $e) {
            Log::error('BadgePdfService: Failed to generate order pass PDF', [
                'order_id' => $order->id,
                'include_holders' => $includeHoldersPage,
                'error' => $e->getMessage(),
            ]);

            // Do not recurse into generateOrderPassPdf — that doubles DomPDF peak memory on 128M hosts.
            if ($includeHoldersPage) {
                try {
                    return $this->renderOrderPassA6Once($order, false);
                } catch (\Throwable $fallbackError) {
                    Log::error('BadgePdfService: Single-page order pass also failed', [
                        'order_id' => $order->id,
                        'error' => $fallbackError->getMessage(),
                    ]);
                }
            }

            try {
                return $this->generateMinimalOrderPassPdf($order);
            } catch (\Throwable $minimalError) {
                throw $e;
            }
        }
    }

    /**
     * One DomPDF render of the A6 order pass (no recursive fallback).
     */
    private function renderOrderPassA6Once(Order $order, bool $includeHoldersPage): string
    {
        [$originalTimeLimit, $originalMemoryLimit] = $this->beginBadgePdfGeneration();

        try {
            $order->loadMissing(['guest', 'event.organizer', 'tickets.ticketType']);
            $event = $order->event;
            $guest = $order->guest;
            if (! $event || ! $guest) {
                throw new \RuntimeException('Order pass is missing guest or event details.');
            }

            $qrCodeService = app(QRCodeService::class);
            $qrValue = $qrCodeService->getOrderPassQrValue($order);
            $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
            $ticketCount = $order->tickets->count();
            $ticketLabel = $ticketCount === 1 ? '1 ticket' : $ticketCount . ' tickets';

            // Keep QR tiny for Plesk hosts (often stuck at 128M even after ini_set).
            $qrImage = $this->orderPassQrDataUri($order, 150);
            if ($qrImage === '') {
                $qrImage = $this->generateQrCodeImage($qrValue, 150);
            }

            $badgeData = [
                'name' => $guest->name ?? '',
                'company' => $guest->company ?? '',
                'jobTitle' => $guest->jobtitle ?? '',
                'country' => $guest->country ?? '',
                'guestType' => 'Event Pass · ' . $ticketLabel,
                'qrCodeImage' => $qrImage,
                'eventName' => $event->name ?? '',
                'eventDate' => $event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('F j, Y') : '',
                'eventDateDisplay' => $this->formatEventDatesForBadge($event),
                'eventLocation' => $event->location ?? '',
                'uuid' => $passCode,
                'holders' => $order->tickets->sortBy('id')->values()->map(fn ($ticket) => [
                    'name' => $ticket->attendee_name ?? $guest->name ?? 'Guest',
                    'ticket_number' => $ticket->ticket_number ?? '',
                    'type' => $ticket->ticketType?->name ?? 'General',
                ])->all(),
                'organizerLogoUri' => '',
                'organizerLogoPath' => null,
            ];

            try {
                // Local logos only — remote HTTP logo downloads spike memory on 128M hosts.
                $localPath = $this->getOrganizerLogoPath($event);
                if ($localPath) {
                    $uri = $this->imagePathToBadgeLogoDataUri($localPath);
                    if ($uri !== '' && strlen($uri) <= 60000) {
                        $badgeData['organizerLogoUri'] = $uri;
                        $badgeData['organizerLogoPath'] = $this->getOrganizerLogoThumbnailPath($localPath) ?? $localPath;
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('BadgePdfService: Organizer logo embed skipped for order pass', [
                    'order_id' => $order->id,
                    'message' => $e->getMessage(),
                ]);
                $badgeData['organizerLogoUri'] = '';
                $badgeData['organizerLogoPath'] = null;
            }

            $html = $this->generateA6BadgeHtml($badgeData);
            if ($includeHoldersPage && ! empty($badgeData['holders'])) {
                $html = $this->wrapOrderPassMultiPageHtml($html, $badgeData);
            }

            $pdf = Pdf::loadHTML($html);
            $this->configureOrderPassPdf($pdf);
            $out = $pdf->output();
            $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

            return $out;
        } catch (\Throwable $e) {
            $this->endBadgePdfGeneration($originalTimeLimit ?? null, $originalMemoryLimit ?? null);
            throw $e;
        }
    }

    /**
     * Cached order-pass package for guest download — original Evella A6 two-page design.
     *
     * Page 1: branded A6 e-badge card (QR + Evella/organizer logos).
     * Page 2: ticket holders list.
     *
     * QR/logo payloads are capped so DomPDF stays within host limits. Falls back to
     * single-page A6, then lightweight card, then plain A4 if generation fails.
     *
     * @return array{pdf_content: string, filename: string}
     */
    public function prepareOrderPass(Order $order): array
    {
        $order->loadMissing(['guest', 'event.organizer', 'tickets.ticketType']);
        $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
        $filename = 'e-ticket-' . $passCode . '.pdf';
        // v7 = lean A6 two-page (smaller QR/logos for 128M Plesk hosts).
        $cachePath = 'passes/v7_a6_order_' . $order->id . '.pdf';

        if (Storage::disk('local')->exists($cachePath)) {
            $cached = (string) Storage::disk('local')->get($cachePath);
            if ($cached !== '' && str_starts_with($cached, '%PDF')) {
                return [
                    'pdf_content' => $cached,
                    'filename' => $filename,
                ];
            }
        }

        $pdfContent = null;
        $errors = [];

        try {
            // Full branded A6 + holders page (original Evella ticket design).
            $pdfContent = $this->generateOrderPassPdf($order, true);
        } catch (\Throwable $e) {
            $errors[] = 'two-page: ' . $e->getMessage();
            Log::warning('BadgePdfService: Two-page A6 pass failed', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }

        if ($pdfContent === null || $pdfContent === '' || ! str_starts_with((string) $pdfContent, '%PDF')) {
            try {
                $pdfContent = $this->generateOrderPassPdf($order, false);
            } catch (\Throwable $e) {
                $errors[] = 'single-page: ' . $e->getMessage();
                Log::warning('BadgePdfService: Single-page A6 pass failed', [
                    'order_id' => $order->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        if ($pdfContent === null || $pdfContent === '' || ! str_starts_with((string) $pdfContent, '%PDF')) {
            try {
                $pdfContent = $this->generateDesignedOrderPassPdf($order);
            } catch (\Throwable $e) {
                $errors[] = 'designed: ' . $e->getMessage();
                $pdfContent = $this->generateMinimalOrderPassPdf($order);
            }
        }

        if ($pdfContent === '' || ! str_starts_with($pdfContent, '%PDF')) {
            throw new \RuntimeException(
                'Order pass PDF generation produced an invalid file'
                . ($errors !== [] ? ' (' . implode('; ', $errors) . ')' : '')
            );
        }

        try {
            Storage::disk('local')->makeDirectory('passes');
            Storage::disk('local')->put($cachePath, $pdfContent);
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: Could not cache order pass', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }

        return [
            'pdf_content' => $pdfContent,
            'filename' => $filename,
        ];
    }

    /**
     * Guest-download package optimized for 128M hosts.
     *
     * Prefers disk cache, then a lean branded A6 (compact logos + tiny QR),
     * then a minimal PDF only if lean fails.
     *
     * @return array{pdf_content: string, filename: string, generator: string}
     */
    public function prepareLeanOrderPass(Order $order): array
    {
        $order->loadMissing(['guest', 'event', 'tickets.ticketType']);
        $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
        $filename = 'e-ticket-' . $passCode . '.pdf';
        // v11 = light HTML (no generateA6BadgeHtml — that OOMs at 128M)
        $cachePath = 'passes/v11_lean_a6_order_' . $order->id . '.pdf';

        if (Storage::disk('local')->exists($cachePath)) {
            $cached = (string) Storage::disk('local')->get($cachePath);
            if ($cached !== '' && str_starts_with($cached, '%PDF')) {
                return [
                    'pdf_content' => $cached,
                    'filename' => $filename,
                    'generator' => 'lean-a6-cache',
                ];
            }
        }

        $pdfContent = '';
        $generator = 'lean-a6';
        $errors = [];

        try {
            $pdfContent = $this->generateLeanBrandedOrderPassPdf($order);
        } catch (\Throwable $e) {
            $errors[] = 'lean: ' . $e->getMessage();
            Log::warning('BadgePdfService: Lean A6 pass failed', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }

        if ($pdfContent === '' || ! str_starts_with($pdfContent, '%PDF')) {
            // Do not call the heavy PNG-logo A6 path here — it routinely OOMs at 128M.
            try {
                $pdfContent = $this->generateMinimalOrderPassPdf($order);
                $generator = 'minimal';
            } catch (\Throwable $e) {
                $errors[] = 'minimal: ' . $e->getMessage();
            }
        }

        if ($pdfContent === '' || ! str_starts_with($pdfContent, '%PDF')) {
            throw new \RuntimeException(
                'Lean order pass generation failed'
                . ($errors !== [] ? ' (' . implode('; ', $errors) . ')' : '')
            );
        }

        try {
            Storage::disk('local')->makeDirectory('passes');
            Storage::disk('local')->put($cachePath, $pdfContent);
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: Could not cache lean order pass', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }

        return [
            'pdf_content' => $pdfContent,
            'filename' => $filename,
            'generator' => $generator,
        ];
    }

    /**
     * Branded A6 two-page pass for 128M hosts.
     *
     * IMPORTANT: Do NOT call generateA6BadgeHtml() here — that path OOMs at 128M and
     * kills the PHP worker (Laravel returns a generic {"message":"Server Error"}).
     * This uses a minimal DomPDF HTML that still matches the Evella pass look.
     */
    public function generateLeanBrandedOrderPassPdf(Order $order): string
    {
        $order->loadMissing(['guest', 'event', 'tickets.ticketType']);
        $guest = $order->guest;
        $event = $order->event;
        if (! $guest || ! $event) {
            throw new \RuntimeException('Order pass is missing guest or event details.');
        }

        $name = htmlspecialchars((string) ($guest->name ?? 'Guest'));
        $jobTitle = htmlspecialchars(trim((string) ($guest->jobtitle ?? '')));
        $company = htmlspecialchars(trim((string) ($guest->company ?? '')));
        $eventName = htmlspecialchars((string) ($event->name ?? 'Event'));
        $eventDate = $event->start_date
            ? htmlspecialchars(\Carbon\Carbon::parse($event->start_date)->format('F j, Y'))
            : '';
        $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
        $ticketCount = max(1, $order->tickets->count());
        $ticketLabel = $ticketCount === 1 ? '1 TICKET' : $ticketCount . ' TICKETS';

        $qrDataUri = $this->orderPassQrDataUri($order, 110);
        if ($qrDataUri === '') {
            try {
                $qrValue = app(QRCodeService::class)->getOrderPassQrValue($order);
                $result = (new \Endroid\QrCode\Builder\Builder())
                    ->writer(new \Endroid\QrCode\Writer\PngWriter())
                    ->data($qrValue)
                    ->encoding(new \Endroid\QrCode\Encoding\Encoding('UTF-8'))
                    ->errorCorrectionLevel(\Endroid\QrCode\ErrorCorrectionLevel::Medium)
                    ->size(110)
                    ->margin(2)
                    ->build();
                $qrDataUri = 'data:image/png;base64,' . base64_encode($result->getString());
            } catch (\Throwable $e) {
                $qrDataUri = '';
            }
        }

        // Tiny logos only (file compact or generated marks) — never full badge logo pipeline.
        $leftLogo = '';
        $rightLogo = '';
        try {
            $organizerPath = $this->getOrganizerLogoPath($event);
            if ($organizerPath) {
                $leftLogo = $this->compactLogoDataUri($organizerPath, 48);
            }
        } catch (\Throwable $e) {
            $leftLogo = '';
        }
        try {
            $evellaPath = $this->getEvellaLogoPath();
            if ($evellaPath) {
                $rightLogo = $this->compactLogoDataUri($evellaPath, 48);
            }
        } catch (\Throwable $e) {
            $rightLogo = '';
        }
        if ($leftLogo === '') {
            $leftLogo = $this->buildSimpleBrandMarkDataUri('Validity', [249, 115, 22]);
        }
        if ($rightLogo === '') {
            $rightLogo = $this->buildSimpleBrandMarkDataUri('evella', [229, 37, 33]);
        }

        $leftImg = $leftLogo !== ''
            ? '<img src="' . $leftLogo . '" style="height:9mm;max-width:36mm;" alt="">'
            : '<span style="font-size:9px;font-weight:700;color:#334155;">Validity</span>';
        $rightImg = $rightLogo !== ''
            ? '<img src="' . $rightLogo . '" style="height:9mm;max-width:36mm;" alt="">'
            : '<span style="font-size:12px;font-weight:800;color:#e52521;">evella</span>';

        $jobBlock = $jobTitle !== ''
            ? '<div class="job">' . $jobTitle . '</div>'
            : ($company !== '' ? '<div class="job">' . $company . '</div>' : '');

        $qrBlock = $qrDataUri !== ''
            ? '<div class="qr"><img src="' . $qrDataUri . '" style="width:32mm;height:32mm;" alt="QR"></div>'
            : '';

        $rows = '';
        $i = 0;
        foreach ($order->tickets->sortBy('id') as $ticket) {
            $i++;
            $hName = htmlspecialchars((string) ($ticket->attendee_name ?? $guest->name ?? 'Guest'));
            $hNum = htmlspecialchars((string) ($ticket->ticket_number ?? ''));
            $hType = htmlspecialchars((string) ($ticket->ticketType?->name ?? 'General'));
            $rows .= '<tr><td class="c">' . $i . '</td><td class="n">' . $hName . '</td>'
                . '<td class="t">' . $hNum . '</td><td class="y">' . $hType . '</td></tr>';
        }
        if ($rows === '') {
            $rows = '<tr><td class="c">1</td><td class="n">' . $name . '</td><td class="t">—</td><td class="y">General</td></tr>';
        }

        $footer = '<table class="foot"><tr>'
            . '<td class="fl">' . $leftImg . '</td>'
            . '<td class="fr">' . $rightImg . '</td>'
            . '</tr></table>';

        // Two pages via ONE page-break-after on page 1 only.
        // No fixed heights / min-heights / absolute positioning (those create blank pages in DomPDF).
        $html = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@page { margin: 10mm 8mm; size: 105mm 148mm; }
body { margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; color: #0f172a; font-size: 11px; }
.sheet { width: 100%; }
.sheet-break { page-break-after: always; }
.event { font-size: 13px; font-weight: 700; text-align: center; margin: 0 0 2px; line-height: 1.2; }
.date { font-size: 11px; font-weight: 600; color: #64748b; text-align: center; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
.name { font-size: 20px; font-weight: 800; text-align: center; margin: 10px 0 4px; }
.job { font-size: 12px; font-weight: 600; color: #64748b; text-align: center; margin: 0 0 8px; }
.qr { text-align: center; margin: 8px 0 4px; }
.code { font-size: 11px; font-weight: 700; font-family: Courier, monospace; letter-spacing: 1px; text-align: center; margin: 4px 0 6px; }
.pass { font-size: 14px; font-weight: 900; color: #e52521; text-transform: uppercase; text-align: center; letter-spacing: 0.5px; margin: 4px 0 14px; }
.foot { width: 100%; border-collapse: collapse; margin-top: 10px; }
.foot td { vertical-align: bottom; padding: 0; }
.foot .fl { text-align: left; width: 50%; }
.foot .fr { text-align: right; width: 50%; }
.h1 { font-size: 15px; font-weight: 900; color: #e52521; text-transform: uppercase; text-align: center; margin: 0 0 4px; }
.sub { font-size: 10px; color: #64748b; text-align: center; margin: 0 0 10px; }
table.holders { width: 100%; border-collapse: collapse; }
table.holders th { font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #e52521; text-align: left; padding: 4px 2px; }
table.holders td { font-size: 10px; border-bottom: 1px solid #e5e7eb; padding: 5px 2px; }
td.c { width: 8%; text-align: center; color: #64748b; font-weight: 700; }
td.n { width: 34%; font-weight: 700; }
td.t { width: 34%; font-family: Courier, monospace; color: #475569; font-size: 9px; }
td.y { width: 24%; color: #64748b; }
</style></head><body>
<div class="sheet sheet-break">
  <div class="event">{$eventName}</div>
  <div class="date">{$eventDate}</div>
  <div class="name">{$name}</div>
  {$jobBlock}
  {$qrBlock}
  <div class="code">{$passCode}</div>
  <div class="pass">EVENT PASS · {$ticketLabel}</div>
  {$footer}
</div>
<div class="sheet">
  <div class="h1">Your tickets</div>
  <div class="sub">Show the pass QR on the previous page at entry.</div>
  <table class="holders">
    <thead><tr><th class="c">#</th><th>Holder</th><th>Ticket</th><th>Type</th></tr></thead>
    <tbody>{$rows}</tbody>
  </table>
  {$footer}
</div>
</body></html>
HTML;

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper([0, 0, 297.64, 419.53]);
        $pdf->setWarnings(false);
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => false,
            'isPhpEnabled' => false,
            'isJavascriptEnabled' => false,
            'defaultFont' => 'Helvetica',
            'dpi' => 72,
        ]);

        return $pdf->output();
    }

    /**
     * Tiny runtime PNG mark when logo files are missing on the host.
     */
    private function buildSimpleBrandMarkDataUri(string $label, array $rgb): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        $w = 220;
        $h = 56;
        $img = imagecreatetruecolor($w, $h);
        if ($img === false) {
            return '';
        }

        imagesavealpha($img, true);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefill($img, 0, 0, $transparent);

        $color = imagecolorallocate($img, $rgb[0], $rgb[1], $rgb[2]);
        $dark = imagecolorallocate($img, 30, 41, 59);
        imagefilledellipse($img, 28, 28, 36, 36, $color);
        imagestring($img, 5, 56, 18, substr($label, 0, 18), $dark);

        ob_start();
        imagepng($img, null, 9);
        $png = ob_get_clean();
        imagedestroy($img);

        if (! is_string($png) || $png === '') {
            return '';
        }

        return 'data:image/png;base64,' . base64_encode($png);
    }

    /**
     * Tiny logo footer for lean A6 (table layout — DomPDF-safe).
     * @deprecated Prefer badgeData logos via generateA6BadgeHtml
     */
    private function buildLeanBrandFooterHtml(Event $event): string
    {
        $left = '';
        $right = '';

        try {
            $organizerPath = $this->getOrganizerLogoPath($event);
            if ($organizerPath) {
                $uri = $this->compactLogoDataUri($organizerPath, 80);
                if ($uri !== '') {
                    $left = '<img src="' . $uri . '" alt="Organizer">';
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        if ($left === '') {
            $left = '<div class="logo-fallback">Validity Event &amp; Marketing</div>';
        }

        try {
            $evellaPath = $this->getEvellaLogoPath();
            if ($evellaPath) {
                $uri = $this->compactLogoDataUri($evellaPath, 80);
                if ($uri !== '') {
                    $right = '<img src="' . $uri . '" alt="Evella">';
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        if ($right === '') {
            $right = '<div class="logo-fallback evella">evella</div>';
        }

        return '<table class="logo-footer"><tr>'
            . '<td class="left">' . $left . '</td>'
            . '<td class="right">' . $right . '</td>'
            . '</tr></table>';
    }

    /**
     * Downscale a logo to a small PNG data URI (keeps DomPDF under 128M).
     */
    private function compactLogoDataUri(string $path, int $maxHeightPx = 80): string
    {
        if (! is_file($path) || ! extension_loaded('gd')) {
            return '';
        }

        $bytes = @file_get_contents($path);
        if (! is_string($bytes) || $bytes === '') {
            return '';
        }

        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            // Fall back to raw embed only when already tiny.
            if (strlen($bytes) <= 12000) {
                return 'data:image/png;base64,' . base64_encode($bytes);
            }

            return '';
        }

        $w = imagesx($src);
        $h = imagesy($src);
        if ($w < 1 || $h < 1) {
            imagedestroy($src);

            return '';
        }

        $maxHeightPx = max(32, min(96, $maxHeightPx));
        $scale = min(1.0, $maxHeightPx / $h, 180 / $w);
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($nw, $nh);
        if ($dst === false) {
            imagedestroy($src);

            return '';
        }

        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        imagealphablending($dst, true);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        ob_start();
        imagepng($dst, null, 9);
        $png = ob_get_clean();
        imagedestroy($dst);

        if (! is_string($png) || $png === '' || strlen($png) > 35000) {
            return '';
        }

        return 'data:image/png;base64,' . base64_encode($png);
    }

    /**
     * A6 event-pass card that matches the badge hierarchy without the heavy DomPDF template.
     */
    public function generateDesignedOrderPassPdf(Order $order): string
    {
        [$originalTimeLimit, $originalMemoryLimit] = $this->beginBadgePdfGeneration();

        try {
            $order->loadMissing(['guest', 'event', 'tickets.ticketType']);
            $guest = $order->guest;
            $event = $order->event;
            if (! $guest || ! $event) {
                throw new \RuntimeException('Order pass is missing guest or event details.');
            }

            $name = htmlspecialchars((string) ($guest->name ?? 'Guest'));
            $eventName = htmlspecialchars((string) ($event->name ?? 'Event'));
            $eventDate = $event->start_date
                ? htmlspecialchars(\Carbon\Carbon::parse($event->start_date)->format('F j, Y'))
                : '';
            $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
            $ticketCount = $order->tickets->count();
            $ticketLabel = htmlspecialchars($ticketCount === 1 ? '1 ticket' : max(1, $ticketCount) . ' tickets');

            $qrDataUri = $this->orderPassQrDataUri($order, 180);
            if ($qrDataUri === '') {
                $qrValue = app(QRCodeService::class)->getOrderPassQrValue($order);
                $qrDataUri = $this->generateQrCodeImage($qrValue, 180);
            }

            $logoHtml = '';
            try {
                $logoUri = $this->getOrganizerLogoDataUri($event);
                if ($logoUri !== '' && strlen($logoUri) <= 100000) {
                    $logoHtml = '<div class="logo"><img src="' . $logoUri . '" alt=""></div>';
                }
            } catch (\Throwable $e) {
                // ignore branding failures
            }

            $html = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
@page { margin: 0; size: 105mm 148mm; }
html, body { margin: 0; padding: 0; width: 105mm; height: 148mm; font-family: Helvetica, Arial, sans-serif; background: #fff; color: #111; }
.card { width: 105mm; height: 148mm; padding: 12mm 8mm 8mm; text-align: center; box-sizing: border-box; }
.event { font-size: 13px; font-weight: bold; line-height: 1.25; margin: 0 0 4px; }
.date { font-size: 10px; color: #555; margin-bottom: 10px; }
.name { font-size: 22px; font-weight: bold; margin: 8px 0 4px; line-height: 1.2; }
.type { font-size: 11px; color: #444; margin-bottom: 10px; }
.qr { margin: 8px auto; }
.qr img { width: 42mm; height: 42mm; }
.code { font-size: 11px; letter-spacing: 1px; margin-top: 8px; color: #333; }
.logo { margin-top: 10px; }
.logo img { max-height: 12mm; max-width: 40mm; }
</style></head><body>
<div class="card">
  <div class="event">{$eventName}</div>
  <div class="date">{$eventDate}</div>
  <div class="name">{$name}</div>
  <div class="type">Event Pass · {$ticketLabel}</div>
  <div class="qr"><img src="{$qrDataUri}" alt="QR"></div>
  <div class="code">{$passCode}</div>
  {$logoHtml}
</div>
</body></html>
HTML;

            $pdf = Pdf::loadHTML($html);
            $this->configureOrderPassPdf($pdf);
            $output = $pdf->output();
            $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

            return $output;
        } catch (\Throwable $e) {
            $this->endBadgePdfGeneration($originalTimeLimit ?? null, $originalMemoryLimit ?? null);
            throw $e;
        }
    }

    /**
     * Lightweight DomPDF e-ticket — fast enough for constrained hosts.
     */
    public function generateMinimalOrderPassPdf(Order $order): string
    {
        [$originalTimeLimit, $originalMemoryLimit] = $this->beginBadgePdfGeneration();

        try {
            $order->loadMissing(['guest', 'event', 'tickets.ticketType']);
            $eventMeta = htmlspecialchars((string) ($order->event?->name ?? 'Event'));
            $guestName = htmlspecialchars((string) ($order->guest?->name ?? 'Guest'));
            $passCode = strtoupper(substr(str_replace('-', '', (string) $order->id), 0, 8));
            $metaLines = [$eventMeta];
            if ($order->event?->start_date) {
                $metaLines[] = htmlspecialchars(\Carbon\Carbon::parse($order->event->start_date)->format('F j, Y'));
            }
            if (! empty($order->event?->location)) {
                $metaLines[] = htmlspecialchars((string) $order->event->location);
            }
            $metaLines[] = 'Guest: ' . $guestName;
            $metaLines[] = 'Pass: ' . $passCode;
            $metaHtml = implode('<br>', $metaLines);
            $qrImg = $this->orderPassQrImgTag($order);

            $rows = '';
            foreach ($order->tickets->sortBy('id') as $ticket) {
                $name = htmlspecialchars((string) ($ticket->attendee_name ?? $order->guest?->name ?? 'Guest'));
                $number = htmlspecialchars((string) ($ticket->ticket_number ?? ''));
                $type = htmlspecialchars((string) ($ticket->ticketType?->name ?? 'General'));
                $rows .= "<tr><td>{$name}</td><td>{$type}</td><td>{$number}</td></tr>";
            }
            if ($rows === '') {
                $rows = '<tr><td colspan="3">Tickets are confirmed for this pass.</td></tr>';
            }

            $html = <<<HTML
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#111;margin:28px;}
h1{font-size:20px;margin:0 0 6px;}
h2{font-size:14px;margin:18px 0 8px;}
table{width:100%;border-collapse:collapse;}
th,td{border:1px solid #ccc;padding:6px;text-align:left;}
.meta{color:#555;margin-bottom:14px;line-height:1.45;}
.qr{text-align:center;margin:18px 0;}
.qr img{width:160px;height:160px;}
.hint{color:#666;font-size:11px;text-align:center;margin-top:8px;}
</style></head><body>
<h1>Event Pass</h1>
<div class="meta">{$metaHtml}</div>
{$qrImg}
<div class="hint">Show this QR at the entrance. Usher will admit your group.</div>
<h2>Ticket holders</h2>
<table><thead><tr><th>Name</th><th>Type</th><th>Ticket #</th></tr></thead><tbody>{$rows}</tbody></table>
</body></html>
HTML;

            $pdf = Pdf::loadHTML($html);
            $pdf->setPaper('a4', 'portrait');
            $pdf->setWarnings(false);
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => false,
                'isPhpEnabled' => false,
                'defaultFont' => 'Helvetica',
            ]);

            $output = $pdf->output();
            $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

            return $output;
        } catch (\Throwable $e) {
            $this->endBadgePdfGeneration($originalTimeLimit ?? null, $originalMemoryLimit ?? null);
            throw $e;
        }
    }

    /**
     * Embed the already-issued pass QR from storage (no DomPDF remote fetch).
     */
    private function orderPassQrImgTag(Order $order): string
    {
        $dataUri = $this->orderPassQrDataUri($order, 180);
        if ($dataUri === '') {
            return '';
        }

        return '<div class="qr"><img src="' . $dataUri . '" alt="Pass QR"></div>';
    }

    /**
     * Load pass QR PNG from disk and optionally downscale for DomPDF.
     */
    private function orderPassQrDataUri(Order $order, int $maxPx = 200): string
    {
        $path = (string) ($order->pass_qr_code_path ?? '');
        if ($path === '') {
            return '';
        }

        $clean = ltrim(preg_replace('#^/storage/#', '', $path) ?? $path, '/');
        $absolute = null;

        try {
            if (Storage::disk('public')->exists($clean)) {
                $absolute = Storage::disk('public')->path($clean);
            } elseif (is_file(public_path('storage/' . $clean))) {
                $absolute = public_path('storage/' . $clean);
            }
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: Could not resolve order pass QR file', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }

        if (! $absolute || ! is_file($absolute)) {
            return '';
        }

        $bytes = @file_get_contents($absolute);
        if ($bytes === false || $bytes === '') {
            return '';
        }

        $maxPx = max(120, min(280, $maxPx));
        if (extension_loaded('gd')) {
            $src = @imagecreatefromstring($bytes);
            if ($src !== false) {
                $width = imagesx($src);
                $height = imagesy($src);
                $edge = max($width, $height);
                if ($edge > $maxPx && $width > 0 && $height > 0) {
                    $scale = $maxPx / $edge;
                    $newW = max(1, (int) round($width * $scale));
                    $newH = max(1, (int) round($height * $scale));
                    $dst = imagecreatetruecolor($newW, $newH);
                    if ($dst !== false) {
                        $white = imagecolorallocate($dst, 255, 255, 255);
                        imagefill($dst, 0, 0, $white);
                        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);
                        ob_start();
                        imagepng($dst, null, 6);
                        $resized = ob_get_clean();
                        imagedestroy($dst);
                        if (is_string($resized) && $resized !== '') {
                            $bytes = $resized;
                        }
                    }
                }
                imagedestroy($src);
            }
        }

        return 'data:image/png;base64,' . base64_encode($bytes);
    }

    private function configureOrderPassPdf($pdf): void
    {
        // A6 points (~105mm x 148mm). Allow CSS page breaks for page 2 holders list.
        $pdf->setPaper([0, 0, 297.64, 419.53]);
        $pdf->setWarnings(false);
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => false,
            'isPhpEnabled' => false,
            'isJavascriptEnabled' => false,
            'defaultFont' => 'Helvetica',
            'dpi' => 96,
            'marginTop' => 0,
            'marginBottom' => 0,
            'marginLeft' => 0,
            'marginRight' => 0,
            'enableCssFloat' => false,
            'defaultMediaType' => 'print',
        ]);
    }

    private function wrapOrderPassMultiPageHtml(string $html, array $badgeData): string
    {
        $holderCount = count($badgeData['holders'] ?? []);

        $html = str_replace(
            'html, body {
            margin: 0;
            padding: 0;
            width: 105mm;
            height: 148mm;
            overflow: hidden;',
            'html, body {
            margin: 0;
            padding: 0;
            width: 105mm;
            height: auto;
            overflow: visible;',
            $html
        );

        $html = str_replace(
            '</head>',
            $this->buildOrderPassHoldersHeadStyles($holderCount) . '</head>',
            $html
        );

        $html = str_replace(
            '<div class="badge">',
            '<div class="badge order-pass-page-one">',
            $html
        );

        return str_replace(
            '</body>',
            $this->buildOrderPassHoldersSection($badgeData) . '</body>',
            $html
        );
    }

    /**
     * @return array{fontSize: string, thSize: string, headerSize: string, subtitleSize: string}
     */
    private function getOrderPassHoldersLayout(int $count): array
    {
        if ($count <= 3) {
            return [
                'fontSize' => '10px', 'thSize' => '9px',
                'headerSize' => '17px', 'subtitleSize' => '10px',
            ];
        }

        if ($count <= 6) {
            return [
                'fontSize' => '9px', 'thSize' => '8px',
                'headerSize' => '15px', 'subtitleSize' => '9px',
            ];
        }

        if ($count <= 10) {
            return [
                'fontSize' => '8px', 'thSize' => '7px',
                'headerSize' => '14px', 'subtitleSize' => '8px',
            ];
        }

        return [
            'fontSize' => '7px', 'thSize' => '6px',
            'headerSize' => '13px', 'subtitleSize' => '7px',
        ];
    }

    private function buildOrderPassHoldersHeadStyles(int $holderCount): string
    {
        return '
    <style>
        .order-pass-page-one {
            page-break-after: avoid !important;
            page-break-inside: avoid;
            height: 148mm;
            max-height: 148mm;
            overflow: hidden;
        }
        .holders-page {
            page-break-before: always;
            page-break-after: avoid !important;
            page-break-inside: avoid;
            width: 105mm;
            max-width: 105mm;
            height: 148mm;
            max-height: 148mm;
            margin: 0;
            padding: 0;
            overflow: hidden;
            box-sizing: border-box;
            font-family: Helvetica, Arial, sans-serif;
        }
        .holders-inner {
            margin: 11mm 8mm 8mm 8mm;
            padding: 0;
            width: auto;
            max-width: 89mm;
        }
        .holders-table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .holders-table th,
        .holders-table td {
            box-sizing: border-box;
            word-wrap: break-word;
            overflow: hidden;
            vertical-align: middle;
        }
    </style>';
    }

    private function truncateHolderText(string $value, int $maxLength): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (strlen($value) <= $maxLength) {
            return htmlspecialchars($value);
        }

        return htmlspecialchars(substr($value, 0, max(0, $maxLength - 1)) . '…');
    }

    private function buildOrderPassHoldersSection(array $data): string
    {
        $holders = $data['holders'] ?? [];
        if ($holders === []) {
            return '';
        }

        $layout = $this->getOrderPassHoldersLayout(count($holders));
        $nameMax = count($holders) > 8 ? 18 : (count($holders) > 5 ? 24 : 32);
        $typeMax = count($holders) > 8 ? 12 : (count($holders) > 5 ? 16 : 22);

        $thBorder = 'border-bottom:2px solid #e52521;color:#0f172a;font-size:' . $layout['thSize'] . ';text-transform:uppercase;font-weight:700;';
        $tdBorder = 'border-bottom:1px solid #e5e7eb;color:#334155;font-size:' . $layout['fontSize'] . ';';

        $rows = '';
        foreach ($holders as $index => $holder) {
            $rows .= '<tr>'
                . '<td style="' . $tdBorder . 'text-align:center;font-weight:700;color:#64748b;padding:4px 1px 4px 0;">' . ($index + 1) . '</td>'
                . '<td style="' . $tdBorder . 'font-weight:700;padding:4px 2px 4px 3px;">' . $this->truncateHolderText((string) ($holder['name'] ?? 'Guest'), $nameMax) . '</td>'
                . '<td style="' . $tdBorder . 'font-family:\'Courier New\',Courier,monospace;padding:4px 2px;color:#475569;">' . htmlspecialchars((string) ($holder['ticket_number'] ?? '')) . '</td>'
                . '<td style="' . $tdBorder . 'color:#64748b;padding:4px 2px 4px 0;">' . $this->truncateHolderText((string) ($holder['type'] ?? 'General'), $typeMax) . '</td>'
                . '</tr>';
        }

        return '
    <div class="holders-page">
        <div class="holders-inner">
            <div style="font-size:' . $layout['headerSize'] . ';font-weight:900;color:#e52521;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 2px;text-align:center;">Your tickets</div>
            <p style="font-size:' . $layout['subtitleSize'] . ';color:#64748b;text-align:center;margin:0 0 10px;line-height:1.25;">Show the pass QR on the previous page at entry.</p>
            <table class="holders-table">
                <colgroup>
                    <col style="width:7%">
                    <col style="width:30%">
                    <col style="width:38%">
                    <col style="width:25%">
                </colgroup>
                <thead>
                    <tr>
                        <th style="' . $thBorder . 'text-align:center;padding:5px 1px 5px 0;">#</th>
                        <th style="' . $thBorder . 'text-align:left;padding:5px 2px 5px 3px;">Holder</th>
                        <th style="' . $thBorder . 'text-align:left;padding:5px 2px;">Ticket</th>
                        <th style="' . $thBorder . 'text-align:left;padding:5px 2px 5px 0;">Type</th>
                    </tr>
                </thead>
                <tbody>' . $rows . '</tbody>
            </table>
            ' . $this->buildLogoFooterHtml($data) . '
        </div>
    </div>';
    }

    /**
     * @return array{0: string|false, 1: string|false}
     */
    private function beginBadgePdfGeneration(): array
    {
        $originalTimeLimit = ini_get('max_execution_time');
        $originalMemoryLimit = ini_get('memory_limit');
        @ini_set('memory_limit', '512M');
        set_time_limit(90);
        return [$originalTimeLimit, $originalMemoryLimit];
    }

    private function endBadgePdfGeneration(string|false|null $originalTimeLimit, string|false|null $originalMemoryLimit): void
    {
        if ($originalTimeLimit !== false && $originalTimeLimit !== null) {
            set_time_limit((int) $originalTimeLimit);
        }

        if ($originalMemoryLimit !== false && $originalMemoryLimit !== null && $originalMemoryLimit !== '') {
            @ini_set('memory_limit', (string) $originalMemoryLimit);
        }
    }

    /**
     * Generate and save badge PDF to storage, returning the storage path
     */
    public function generateAndSaveBadgePdf(Attendee $attendee, Event $event, ?FormSubmission $formSubmission = null): string
    {
        try {
            // Generate PDF content
            if ($formSubmission) {
                $pdfContent = $this->generateBadgePdfWithFormData($attendee, $event, $formSubmission);
            } else {
                $pdfContent = $this->generateBadgePdf($attendee, $event);
            }

            // Create storage path: badges/event_{id}/attendee_{id}_badge.pdf
            $storagePath = "badges/event_{$event->id}/attendee_{$attendee->id}_badge.pdf";

            // Ensure directory exists
            Storage::disk('public')->makeDirectory("badges/event_{$event->id}");

            // Save PDF to storage
            Storage::disk('public')->put($storagePath, $pdfContent);

            Log::info('Badge PDF saved to storage', [
                'attendee_id' => $attendee->id,
                'event_id' => $event->id,
                'storage_path' => $storagePath
            ]);

            return $storagePath;

        } catch (\Exception $e) {
            Log::error('Failed to save badge PDF to storage', [
                'attendee_id' => $attendee->id,
                'event_id' => $event->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function resolveFormSubmissionForAttendee(Attendee $attendee): ?FormSubmission
    {
        return FormSubmission::where('attendee_id', $attendee->id)
            ->orWhere('guest_id', $attendee->guest_id)
            ->with('form')
            ->first();
    }

    public function buildBadgeDownloadFilename(Attendee $attendee, ?Event $event = null): string
    {
        $event = $event ?? $attendee->event;
        $confirmationCode = 'REG-' . str_pad((string) $attendee->id, 8, '0', STR_PAD_LEFT);
        $eventName = preg_replace('/[^a-zA-Z0-9\s]/', '', $event->name ?? 'event');
        $eventName = preg_replace('/\s+/', '-', trim($eventName));

        return "event-confirmation-badge-{$eventName}-{$confirmationCode}.pdf";
    }

    public function getPublicBadgeDownloadUrl(Attendee $attendee, Event $event): string
    {
        $attendee->loadMissing('guest');
        $base = rtrim((string) config('app.url'), '/');
        $guestUuid = (string) ($attendee->guest->uuid ?? '');

        return $base . '/api/public/events/' . $event->id . '/attendees/' . $attendee->id . '/badge'
            . '?guestUuid=' . rawurlencode($guestUuid);
    }

    /**
     * Get short badge download URL for SMS (uses simplified route)
     * Format: {base}/badge/{attendeeId}/{guestUuidShort}
     */
    public function getShortBadgeDownloadUrl(Attendee $attendee, Event $event): string
    {
        $attendee->loadMissing('guest');
        $base = $this->resolveBadgeShortUrlBase();
        $guestUuid = strtolower((string) ($attendee->guest->uuid ?? ''));
        $guestUuidShort = $guestUuid !== '' ? substr($guestUuid, 0, 8) : '';

        return $base.'/badge/'.$attendee->id.'/'.$guestUuidShort;
    }

    /**
     * Public base URL for SMS badge links (SPA route when FRONTEND_URL is set).
     */
    private function resolveBadgeShortUrlBase(): string
    {
        $frontend = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', '')), '/');
        if ($frontend !== '') {
            return $frontend;
        }

        return rtrim((string) config('app.url'), '/');
    }

    public function getLocalBadgeCachePath(int $attendeeId, int $eventId): string
    {
        $revision = self::BADGE_RENDER_REVISION;

        return "badges/event-{$eventId}/attendee-{$attendeeId}-{$revision}.pdf";
    }

    public function generateFreshBadgePdf(Attendee $attendee, Event $event, ?FormSubmission $formSubmission = null): string
    {
        $attendee->loadMissing(['guest', 'guestType']);

        if ($formSubmission) {
            return $this->generateBadgePdfWithFormData($attendee, $event, $formSubmission);
        }

        return $this->generateBadgePdf($attendee, $event);
    }

    public function syncStoredBadge(Attendee $attendee, Event $event, string $pdfContent): string
    {
        if ($attendee->badge_path && Storage::disk('public')->exists($attendee->badge_path)) {
            Storage::disk('public')->delete($attendee->badge_path);
        }

        Storage::disk('public')->makeDirectory("badges/event_{$event->id}");
        $storagePath = "badges/event_{$event->id}/attendee_{$attendee->id}_badge.pdf";
        Storage::disk('public')->put($storagePath, $pdfContent);

        if ($attendee->badge_path !== $storagePath) {
            $attendee->update(['badge_path' => $storagePath]);
        }

        return $storagePath;
    }

    /**
     * Single source for registration e-badges (email attachment, success page download, public link).
     *
     * @return array{pdf_content: string, filename: string, download_url: string}
     */
    public function prepareRegistrationBadge(Attendee $attendee, Event $event, ?FormSubmission $formSubmission = null): array
    {
        $formSubmission ??= $this->resolveFormSubmissionForAttendee($attendee);
        $pdfContent = $this->resolveBadgePdfContent($attendee, $event, $formSubmission);

        return [
            'pdf_content' => $pdfContent,
            'filename' => $this->buildBadgeDownloadFilename($attendee, $event),
            'download_url' => $this->getPublicBadgeDownloadUrl($attendee, $event),
        ];
    }

    private function resolveBadgePdfContent(Attendee $attendee, Event $event, ?FormSubmission $formSubmission = null): string
    {
        $localCachePath = $this->getLocalBadgeCachePath($attendee->id, $event->id);
        if (Storage::disk('local')->exists($localCachePath)) {
            return (string) Storage::disk('local')->get($localCachePath);
        }

        $pdfContent = $this->generateFreshBadgePdf($attendee, $event, $formSubmission);
        $this->syncStoredBadge($attendee, $event, $pdfContent);
        Storage::disk('local')->put($localCachePath, $pdfContent);

        return $pdfContent;
    }

    /**
     * Generate badge PDF using form submission data and badge field mappings
     */
    public function generateBadgePdfWithFormData(
        Attendee $attendee,
        Event $event,
        FormSubmission $formSubmission = null
    ): string {
        try {
            [$originalTimeLimit, $originalMemoryLimit] = $this->beginBadgePdfGeneration();

            // Check if GD extension is available for PDF generation
            if (!extension_loaded('gd')) {
                Log::info('GD extension not available, generating text-based badge');
                $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

                return $this->generateTextBasedBadge($attendee, $event);
            }

            $guest = $attendee->guest;
            $guestType = $attendee->guestType;

            // Generate QR code data
            $qrData = $this->generateSimpleQrData($attendee, $event);
            $qrPixelSize = $this->getBadgeQrPixelSize();
            $qrCodeImage = $this->generateQrCodeImage($qrData, $qrPixelSize);

            // Prepare base badge data
            $confirmationCode = 'REG-' . str_pad($attendee->id, 8, '0', STR_PAD_LEFT);
            $badgeData = [
                'name' => $guest->name ?? '',
                'company' => $guest->company ?? '',
                'jobTitle' => $guest->jobtitle ?? '',
                'country' => $guest->country ?? '',
                'guestType' => $guestType ? $guestType->name : 'Visitor',
                'qrData' => $qrData,
                'qrCodeImage' => $qrCodeImage,
                'eventName' => $event->name,
                'eventDate' => $event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('F j, Y') : '',
                'eventDateDisplay' => $this->formatEventDatesForBadge($event),
                'eventLocation' => $event->location ?? '',
                'badgeId' => $confirmationCode,
                'confirmationCode' => $confirmationCode,
                'attendeeId' => $attendee->id,
                'uuid' => substr($guest->uuid ?? $guest->id ?? '', 0, 12),
                'qrValue' => $this->getQrValue($attendee, $event),
            ];

            // If we have form submission data, apply badge field mappings
            if ($formSubmission && $formSubmission->form) {
                $mappedData = $this->badgeMappingService->applyMappingsToBadgeData(
                    $formSubmission->form,
                    $formSubmission
                );

                // Override badge data with mapped values
                foreach ($mappedData as $key => $value) {
                    $badgeData[$key] = $value;
                }

                Log::info('Applied badge field mappings', [
                    'form_id' => $formSubmission->form->id,
                    'attendee_id' => $attendee->id,
                    'mappings_applied' => count($mappedData)
                ]);
            }

            $badgeData = $this->appendBrandingToBadgeData($badgeData, $event);

            // Generate HTML for the badge
            $html = $this->generateBadgeHtml($badgeData);

            $pdf = Pdf::loadHTML($html);
            $this->configureBadgePdf($pdf);

            $pdfOutput = $pdf->output();

            $this->endBadgePdfGeneration($originalTimeLimit, $originalMemoryLimit);

            return $pdfOutput;

        } catch (\Exception $e) {
            $this->endBadgePdfGeneration($originalTimeLimit ?? null, $originalMemoryLimit ?? null);

            Log::error('BadgePdfService: Failed to generate PDF with form data', [
                'attendee_id' => $attendee->id,
                'event_id' => $event->id,
                'form_submission_id' => $formSubmission?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception('PDF generation failed: ' . $e->getMessage(), 0, $e);
        }
    }

    private function generateQrCodeImage($data, int $size = 280): string
    {
        try {
            $size = max(120, min(400, $size));
            // Try cache first
            $cacheKey = md5($data . '|' . $size);
            $cachedQr = $this->getCachedQrCode($cacheKey);
            if ($cachedQr !== null) {
                Log::info('QR code cache hit', ['cache_key' => $cacheKey]);
                return $cachedQr;
            }

            Log::info('QR code cache miss - generating new QR', ['cache_key' => $cacheKey]);

            // Set execution time limit for QR generation
            $originalTimeLimit = ini_get('max_execution_time');
            set_time_limit(10); // 10 seconds max for QR generation

            // Try to use GD extension first
            if (extension_loaded('gd')) {
                try {
                    // Create QR code with constructor parameters - optimized for 4"x4" badge
                    $qrCode = new QrCode(
                        data: $data,
                        size: $size,
                        margin: 2,
                        errorCorrectionLevel: ErrorCorrectionLevel::Medium,
                        foregroundColor: new Color(0, 0, 0),
                        backgroundColor: new Color(255, 255, 255)
                    );

                    // Create writer
                    $writer = new PngWriter();
                    $result = $writer->write($qrCode);

                    // Convert to base64 for embedding in HTML
                    $dataUri = $result->getDataUri();

                    // Cache the QR code
                    $this->cacheQrCode($cacheKey, $dataUri);

                    // Restore original time limit
                    set_time_limit($originalTimeLimit);

                    return $dataUri;
                } catch (\Exception $gdError) {
                    Log::warning('GD-based QR generation failed: ' . $gdError->getMessage());
                    // Fall through to web-based generation
                }
            }

            // Fallback: Use web-based QR code generation service
            Log::info('Using web-based QR code generation (GD not available or failed)');
            $webQr = $this->generateWebBasedQrCode($data, $size);

            // Cache the web-generated QR code
            $this->cacheQrCode($cacheKey, $webQr);

            return $webQr;

        } catch (\Exception $e) {
            // Restore original time limit
            set_time_limit($originalTimeLimit ?? 30);

            // Fallback: Create a simple text-based QR placeholder if GD is not available
            Log::warning('QR Code generation failed, using fallback: ' . $e->getMessage());

            // Create a simple SVG-based QR placeholder
            $svg = $this->generateFallbackQrCode($data);
            return 'data:image/svg+xml;base64,' . base64_encode($svg);
        }
    }

    private function generateWebBasedQrCode($data, int $size = 280): string
    {
        try {
            $size = max(120, min(400, $size));
            // Use multiple QR services for better reliability
            $services = [
                "https://api.qrserver.com/v1/create-qr-code/?size={$size}x{$size}&data=" . urlencode($data) . "&format=png&margin=2",
                "https://chart.googleapis.com/chart?chs={$size}x{$size}&cht=qr&chl=" . urlencode($data),
                "https://quickchart.io/qr?text=" . urlencode($data) . "&size={$size}"
            ];

            foreach ($services as $url) {
                try {
                    // Get the image data with timeout
                    $context = stream_context_create([
                        'http' => [
                            'timeout' => 8,
                            'method' => 'GET',
                            'header' => 'User-Agent: VEMS-Badge-Service/1.0'
                        ]
                    ]);

                    $imageData = file_get_contents($url, false, $context);

                    if ($imageData !== false && strlen($imageData) > 100) { // Check if we got actual image data
                        // Convert to base64 data URI
                        $base64 = base64_encode($imageData);
                        Log::info('Successfully generated QR code using web service');
                        return 'data:image/png;base64,' . $base64;
                    }
                } catch (\Exception $serviceError) {
                    Log::warning('QR service failed: ' . $serviceError->getMessage());
                    continue; // Try next service
                }
            }

            // If all web services fail, use fallback SVG
            throw new \Exception('All web-based QR services failed');
        } catch (\Exception $e) {
            Log::warning('Web-based QR code generation failed: ' . $e->getMessage());
            // Fallback to SVG
            $svg = $this->generateFallbackQrCode($data);
            return 'data:image/svg+xml;base64,' . base64_encode($svg);
        }
    }

    private function generateFallbackQrCode($data): string
    {
        // Create a more detailed SVG-based QR code placeholder with actual data
        $confirmationCode = 'REG-' . str_pad(substr($data, strpos($data, '"attendee_id":') + 14, 10), 8, '0', STR_PAD_LEFT);
        $confirmationCode = preg_replace('/[^0-9]/', '', $confirmationCode);
        $confirmationCode = 'REG-' . str_pad($confirmationCode, 8, '0', STR_PAD_LEFT);

        return '<?xml version="1.0" encoding="UTF-8"?>
        <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="qrPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <rect width="10" height="10" fill="white"/>
                    <rect width="2" height="2" fill="black"/>
                    <rect x="8" y="8" width="2" height="2" fill="black"/>
                    <rect x="2" y="8" width="2" height="2" fill="black"/>
                    <rect x="8" y="2" width="2" height="2" fill="black"/>
                </pattern>
            </defs>
            <rect width="120" height="120" fill="white" stroke="#ea580c" stroke-width="3" rx="8"/>
            <rect x="10" y="10" width="100" height="100" fill="url(#qrPattern)"/>
            <text x="60" y="65" text-anchor="middle" font-family="Arial" font-size="8" fill="#ea580c" font-weight="bold">QR CODE</text>
            <text x="60" y="75" text-anchor="middle" font-family="Arial" font-size="6" fill="#ea580c">' . htmlspecialchars($confirmationCode) . '</text>
            <text x="60" y="85" text-anchor="middle" font-family="Arial" font-size="4" fill="#64748b">Event Confirmation</text>
        </svg>';
    }

    private function calculateNameFontSize(string $name): int
    {
        if (empty($name)) {
            return 44;
        }

        $length = strlen(trim($name));

        if ($length <= 10) {
            return 50;
        }
        if ($length <= 18) {
            return 42;
        }
        if ($length <= 26) {
            return 36;
        }
        if ($length <= 34) {
            return 30;
        }

        return 26;
    }

    private function calculateCompanyFontSize(string $company): int
    {
        if (empty($company)) {
            return 24;
        }

        $companyLength = strlen($company);

        if ($companyLength <= 10) {
            return 32;
        } elseif ($companyLength <= 20) {
            return 26;
        } elseif ($companyLength <= 30) {
            return 22;
        } else {
            return 20;
        }
    }

    private function calculateJobTitleFontSize(string $jobTitle): int
    {
        if (empty($jobTitle)) {
            return 22;
        }

        $jobTitleLength = strlen($jobTitle);

        if ($jobTitleLength <= 15) {
            return 28;
        } elseif ($jobTitleLength <= 25) {
            return 24;
        } elseif ($jobTitleLength <= 35) {
            return 20;
        } else {
            return 18;
        }
    }

    private function calculateEventNameFontSize(string $eventName): int
    {
        if ($eventName === '') {
            return 22;
        }

        $length = strlen($eventName);

        if ($length <= 24) {
            return 24;
        }
        if ($length <= 40) {
            return 20;
        }
        if ($length <= 56) {
            return 18;
        }

        return 16;
    }

    private function getTicketDesignPath(): ?string
    {
        $paths = [
            public_path('evella-ticket-design.png'),
            resource_path('branding/evella-ticket-design.png'),
            public_path('evella ticket design.png'),
        ];

        foreach ($paths as $path) {
            if (is_string($path) && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function getTicketDimensions(): array
    {
        $widthPx = 1734;
        $heightPx = 693;

        $path = $this->getTicketDesignPath();
        if ($path && ($info = @getimagesize($path))) {
            $widthPx = (int) $info[0];
            $heightPx = (int) $info[1];
        }

        return [
            'width_px' => $widthPx,
            'height_px' => $heightPx,
            'width_pt' => $widthPx * 0.75,
            'height_pt' => $heightPx * 0.75,
        ];
    }

    private function getTicketBackgroundDataUri(): string
    {
        $path = $this->getTicketDesignPath();
        if (! $path) {
            return '';
        }

        $mime = 'image/png';
        if (function_exists('mime_content_type')) {
            $detected = @mime_content_type($path);
            if (is_string($detected) && $detected !== '') {
                $mime = $detected;
            }
        }

        return 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($path));
    }

    private function getBadgeLayout(): string
    {
        return self::BADGE_LAYOUT_A6;
    }

    private function getBadgeQrPixelSize(): int
    {
        if ($this->getBadgeLayout() === self::BADGE_LAYOUT_TICKET) {
            return (int) round($this->getTicketDimensions()['height_px'] * 0.4);
        }

        return 220;
    }

    private function configureBadgePdf($pdf): void
    {
        if ($this->getBadgeLayout() === self::BADGE_LAYOUT_TICKET) {
            $this->configureTicketPdf($pdf);

            return;
        }

        $this->configureA6Pdf($pdf);
    }

    private function configureA6Pdf($pdf): void
    {
        $pdf->setPaper([0, 0, 297.64, 419.53]);
        $pdf->setWarnings(false);
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'isPhpEnabled' => false,
            'isJavascriptEnabled' => false,
            'defaultFont' => 'Helvetica',
            'dpi' => 150,
            'marginTop' => 0,
            'marginBottom' => 0,
            'marginLeft' => 0,
            'marginRight' => 0,
            'pageBreak' => false,
            'enableCssFloat' => false,
            'defaultMediaType' => 'print',
        ]);
    }

    private function configureTicketPdf($pdf): void
    {
        $dims = $this->getTicketDimensions();
        $pdf->setPaper([0, 0, $dims['width_pt'], $dims['height_pt']]);
        $pdf->setWarnings(false);
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'isPhpEnabled' => false,
            'isJavascriptEnabled' => false,
            'defaultFont' => 'Helvetica',
            'dpi' => 150,
            'marginTop' => 0,
            'marginBottom' => 0,
            'marginLeft' => 0,
            'marginRight' => 0,
            'pageBreak' => false,
            'defaultMediaType' => 'print',
        ]);
    }

    private function getEvellaLogoDataUri(): string
    {
        $path = $this->getEvellaLogoPath();

        return $path ? $this->imagePathToBadgeLogoDataUri($path) : '';
    }

    private function getEvellaLogoPath(): ?string
    {
        $paths = [
            public_path('evella-logo.png'),
            resource_path('branding/evella-logo.png'),
        ];

        foreach ($paths as $path) {
            if (is_string($path) && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function appendBrandingToBadgeData(array $badgeData, Event $event): array
    {
        $organizerPath = $this->getOrganizerLogoPath($event);
        $badgeData['organizerLogoUri'] = $this->getOrganizerLogoDataUri($event);
        $badgeData['organizerLogoPath'] = $organizerPath
            ? ($this->getOrganizerLogoThumbnailPath($organizerPath) ?? $organizerPath)
            : null;

        return $badgeData;
    }

    /**
     * @return list<string>
     */
    private function getOrganizerLogoCandidates(Event $event): array
    {
        $event->loadMissing('organizer');

        return array_values(array_unique(array_filter([
            trim((string) ($event->organizer_logo ?? '')),
            trim((string) ($event->organizer?->logo ?? '')),
        ])));
    }

    private function getOrganizerLogoPath(Event $event): ?string
    {
        foreach ($this->getOrganizerLogoCandidates($event) as $raw) {
            if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
                continue;
            }

            $clean = ltrim($raw, '/');
            if (Storage::disk('public')->exists($clean)) {
                return Storage::disk('public')->path($clean);
            }
        }

        return null;
    }

    private function getOrganizerLogoDataUri(Event $event): string
    {
        foreach ($this->getOrganizerLogoCandidates($event) as $raw) {
            if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://')) {
                $uri = $this->remoteImageToDataUri($raw);
                if ($uri !== '') {
                    return $uri;
                }

                continue;
            }

            $clean = ltrim($raw, '/');
            if (! Storage::disk('public')->exists($clean)) {
                continue;
            }

            $uri = $this->imagePathToBadgeLogoDataUri(Storage::disk('public')->path($clean));
            if ($uri !== '') {
                return $uri;
            }
        }

        return '';
    }

    private function imagePathToBadgeLogoDataUri(string $path): string
    {
        $png = $this->resolveBadgeLogoPngFromPath($path);

        return $png !== '' ? 'data:image/png;base64,' . base64_encode($png) : '';
    }

    private function resolveBadgeLogoPngFromPath(string $path): string
    {
        if (! is_string($path) || ! file_exists($path)) {
            return '';
        }

        $thumbPath = $this->getOrganizerLogoThumbnailPath($path);
        if (is_string($thumbPath) && file_exists($thumbPath)) {
            return (string) file_get_contents($thumbPath);
        }

        $info = @getimagesize($path);
        if (! is_array($info) || empty($info[0]) || empty($info[1])) {
            return '';
        }

        $width = (int) $info[0];
        $height = (int) $info[1];
        $imageType = (int) ($info[2] ?? 0);
        $pixels = $width * $height;

        if ($pixels > self::BADGE_LOGO_MAX_SOURCE_PIXELS) {
            Log::info('BadgePdfService: downscaling oversized logo for badge embed', [
                'path' => $path,
                'dims' => "{$width}x{$height}",
            ]);
            $png = $this->encodeOversizedBadgeLogoPng($path, $width, $height, $imageType);
        } else {
            $png = $this->encodeBadgeLogoPng($path, $width, $height);
        }

        if ($png !== '') {
            $this->storeOrganizerLogoThumbnail($path, $png);
        }

        return $png;
    }

    private function getOrganizerLogoThumbnailCacheKey(string $path): string
    {
        $mtime = @filemtime($path) ?: 0;

        return 'badge-logo-thumbs/' . md5($path . '|' . $mtime . '|' . self::BADGE_RENDER_REVISION) . '.png';
    }

    private function getOrganizerLogoThumbnailPath(string $path): ?string
    {
        if (! file_exists($path)) {
            return null;
        }

        $cacheKey = $this->getOrganizerLogoThumbnailCacheKey($path);
        if (! Storage::disk('local')->exists($cacheKey)) {
            return null;
        }

        return Storage::disk('local')->path($cacheKey);
    }

    private function storeOrganizerLogoThumbnail(string $sourcePath, string $png): void
    {
        $cacheKey = $this->getOrganizerLogoThumbnailCacheKey($sourcePath);
        Storage::disk('local')->put($cacheKey, $png);
    }

    private function remoteImageToDataUri(string $url): string
    {
        try {
            $context = stream_context_create([
                'http' => ['timeout' => 5],
                'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
            ]);
            $contents = @file_get_contents($url, false, $context);
            if ($contents === false || $contents === '') {
                return '';
            }

            $info = @getimagesizefromstring($contents);
            if (! is_array($info) || empty($info[0]) || empty($info[1])) {
                return '';
            }

            $width = (int) $info[0];
            $height = (int) $info[1];
            $png = ($width * $height) > self::BADGE_LOGO_MAX_SOURCE_PIXELS
                ? $this->encodeOversizedBadgeLogoPngFromBinary($contents, $width, $height)
                : $this->encodeBadgeLogoPngFromBinary($contents, $width, $height);

            return $png !== '' ? 'data:image/png;base64,' . base64_encode($png) : '';
        } catch (\Throwable $e) {
            return '';
        }
    }

    private function encodeBadgeLogoPng(string $path, int $width, int $height): string
    {
        if ($width <= self::BADGE_LOGO_MAX_PIXEL_WIDTH && $height <= self::BADGE_LOGO_MAX_PIXEL_HEIGHT) {
            return (string) @file_get_contents($path);
        }

        try {
            if (class_exists(\Intervention\Image\Laravel\Facades\Image::class)) {
                $image = \Intervention\Image\Laravel\Facades\Image::read($path);
                $image->scaleDown(self::BADGE_LOGO_MAX_PIXEL_WIDTH, self::BADGE_LOGO_MAX_PIXEL_HEIGHT);

                return (string) $image->toPng();
            }
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: Intervention logo resize failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->encodeBadgeLogoPngWithGd($path, $width, $height, (int) (@getimagesize($path)[2] ?? 0));
    }

    private function encodeBadgeLogoPngFromBinary(string $contents, int $width, int $height): string
    {
        if ($width <= self::BADGE_LOGO_MAX_PIXEL_WIDTH && $height <= self::BADGE_LOGO_MAX_PIXEL_HEIGHT) {
            return $contents;
        }

        try {
            if (class_exists(\Intervention\Image\Laravel\Facades\Image::class)) {
                $image = \Intervention\Image\Laravel\Facades\Image::read($contents);
                $image->scaleDown(self::BADGE_LOGO_MAX_PIXEL_WIDTH, self::BADGE_LOGO_MAX_PIXEL_HEIGHT);

                return (string) $image->toPng();
            }
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: Intervention remote logo resize failed', [
                'error' => $e->getMessage(),
            ]);
        }

        if (! extension_loaded('gd')) {
            return '';
        }

        $src = @imagecreatefromstring($contents);
        if (! $src) {
            return '';
        }

        $resized = $this->resizeGdImageForBadge($src, $width, $height);
        imagedestroy($src);
        if (! $resized) {
            return '';
        }

        ob_start();
        imagepng($resized, null, 7);
        $png = (string) ob_get_clean();
        imagedestroy($resized);

        return $png;
    }

    private function encodeBadgeLogoPngWithGd(string $path, int $width, int $height, int $imageType): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        $src = $this->createGdImageFromPath($path, $imageType);
        if (! $src) {
            return '';
        }

        return $this->renderResizedBadgeLogoPng($src, $width, $height);
    }

    private function encodeOversizedBadgeLogoPng(string $path, int $width, int $height, int $imageType): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        $prevLimit = ini_get('memory_limit');
        @ini_set('memory_limit', '1024M');

        try {
            $src = $this->createGdImageFromPath($path, $imageType);
            if (! $src) {
                Log::warning('BadgePdfService: failed to decode oversized logo for badge', ['path' => $path]);

                return '';
            }

            return $this->renderResizedBadgeLogoPng($src, $width, $height);
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: oversized logo resize failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return '';
        } finally {
            @ini_set('memory_limit', $prevLimit ?: '512M');
        }
    }

    private function encodeOversizedBadgeLogoPngFromBinary(string $contents, int $width, int $height): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        $prevLimit = ini_get('memory_limit');
        @ini_set('memory_limit', '1024M');

        try {
            $src = @imagecreatefromstring($contents);
            if (! $src) {
                return '';
            }

            return $this->renderResizedBadgeLogoPng($src, $width, $height);
        } catch (\Throwable $e) {
            Log::warning('BadgePdfService: oversized remote logo resize failed', [
                'error' => $e->getMessage(),
            ]);

            return '';
        } finally {
            @ini_set('memory_limit', $prevLimit ?: '512M');
        }
    }

    /**
     * @param resource $src
     */
    private function renderResizedBadgeLogoPng($src, int $width, int $height): string
    {
        $resized = $this->resizeGdImageForBadge($src, $width, $height);
        imagedestroy($src);
        if (! $resized) {
            return '';
        }

        ob_start();
        imagepng($resized, null, 7);
        $png = (string) ob_get_clean();
        imagedestroy($resized);

        return $png;
    }

    /**
     * @return resource|false
     */
    private function createGdImageFromPath(string $path, int $imageType)
    {
        return match ($imageType) {
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_GIF => @imagecreatefromgif($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => @imagecreatefromstring((string) @file_get_contents($path)),
        };
    }

    /**
     * @param resource $src
     * @return resource|false
     */
    private function resizeGdImageForBadge($src, int $width, int $height)
    {
        $scale = min(
            self::BADGE_LOGO_MAX_PIXEL_WIDTH / max($width, 1),
            self::BADGE_LOGO_MAX_PIXEL_HEIGHT / max($height, 1),
            1.0
        );
        $newWidth = max(1, (int) round($width * $scale));
        $newHeight = max(1, (int) round($height * $scale));

        $dst = imagecreatetruecolor($newWidth, $newHeight);
        if (! $dst) {
            return false;
        }

        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $newWidth, $newHeight, $transparent);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $dst;
    }

    /**
     * Logo display size in mm, preserving the source image aspect ratio.
     *
     * @return array{width_mm: float, height_mm: float}
     */
    private function getLogoDisplayMm(?string $path): array
    {
        $targetHeightMm = self::LOGO_HEIGHT_MM;

        if ($path && ($info = @getimagesize($path)) && $info[1] > 0) {
            $ratio = $info[0] / $info[1];

            return [
                'width_mm' => round($targetHeightMm * $ratio, 2),
                'height_mm' => $targetHeightMm,
            ];
        }

        return [
            'width_mm' => 28.0,
            'height_mm' => $targetHeightMm,
        ];
    }

    private function buildEvellaLogoMarkup(?array $data = null): string
    {
        $logoUri = trim((string) ($data['evellaLogoUri'] ?? ''));
        if ($logoUri === '') {
            $logoUri = $this->getEvellaLogoDataUri();
        }
        $logoSize = $this->getLogoDisplayMm($this->getEvellaLogoPath());
        // Compact lean logos are already small — keep display height tight.
        if (! empty($data['leanPass'])) {
            $logoSize = ['width_mm' => 28.0, 'height_mm' => 9.0];
        }
        $logoStyle = 'width:' . $logoSize['width_mm'] . 'mm;height:' . $logoSize['height_mm'] . 'mm;';

        if ($logoUri !== '') {
            return '<img src="' . $logoUri . '" class="brand-logo evella-logo" alt="Evella" style="' . $logoStyle . '">';
        }

        return '<div class="evella-logo-fallback">evella</div>';
    }

    private function buildLogoFooterHtml(array $data, string $extraClass = ''): string
    {
        $organizerUri = trim((string) ($data['organizerLogoUri'] ?? ''));
        $evellaMarkup = $this->buildEvellaLogoMarkup($data);
        $suffix = $extraClass !== '' ? ' ' . $extraClass : '';
        $isLean = ! empty($data['leanPass']);

        if ($organizerUri !== '') {
            $organizerPath = $data['organizerLogoPath'] ?? null;
            $organizerSize = $isLean
                ? ['width_mm' => 32.0, 'height_mm' => 9.0]
                : $this->getLogoDisplayMm(is_string($organizerPath) ? $organizerPath : null);
            $organizerStyle = 'width:' . $organizerSize['width_mm'] . 'mm;height:' . $organizerSize['height_mm'] . 'mm;';
            $organizerMarkup = '<img src="' . $organizerUri . '" class="brand-logo organizer-logo" alt="Organizer" style="' . $organizerStyle . '">';

            return '<div class="logo-footer logo-footer-split' . $suffix . '">'
                . '<div class="logo-footer-left">' . $organizerMarkup . '</div>'
                . '<div class="logo-footer-right">' . $evellaMarkup . '</div>'
                . '</div>';
        }

        return '<div class="logo-footer logo-footer-center' . $suffix . '">' . $evellaMarkup . '</div>';
    }

    private function getLogoFooterCss(string $marginTopMm = '16'): string
    {
        return '
        .logo-footer {
            margin-top: ' . $marginTopMm . 'mm;
            padding: 0;
            line-height: 0;
        }
        .logo-footer-center {
            text-align: center;
        }
        .logo-footer-split {
            display: table;
            width: 100%;
        }
        .logo-footer-left,
        .logo-footer-right {
            display: table-cell;
            vertical-align: bottom;
            width: 50%;
            line-height: 0;
        }
        .logo-footer-left {
            text-align: left;
            padding-left: 2mm;
        }
        .logo-footer-right {
            text-align: right;
            padding-right: 2mm;
        }
        .logo-footer-ticket {
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            margin-top: 0;
            padding: 0 24px;
        }
        .brand-logo,
        .evella-logo {
            display: inline-block;
            border: none;
        }
        .evella-logo-fallback {
            font-size: 14px;
            font-weight: 700;
            color: #e52521;
            letter-spacing: 0.5px;
            line-height: 1.2;
        }';
    }

    private function generateBadgeHtml(array $data): string
    {
        if ($this->getBadgeLayout() === self::BADGE_LAYOUT_TICKET) {
            return $this->generateTicketBadgeHtml($data);
        }

        return $this->generateA6BadgeHtml($data);
    }

    /**
     * Clean A6 portrait badge (default for events).
     */
    private function generateA6BadgeHtml(array $data): string
    {
        $name = trim((string) ($data['name'] ?? ''));
        $company = trim((string) ($data['company'] ?? ''));
        $jobTitle = trim((string) ($data['jobTitle'] ?? ''));
        $guestType = trim((string) ($data['guestType'] ?? 'Visitor'));
        $uuid = trim((string) ($data['uuid'] ?? ''));
        $eventName = trim((string) ($data['eventName'] ?? ''));
        $eventDateDisplay = trim((string) ($data['eventDateDisplay'] ?? $data['eventDate'] ?? ''));
        $logoFooterBlock = $this->buildLogoFooterHtml($data);

        $nameFontPx = min($this->calculateA6NameFontSize($name), 30);
        $companyFontPx = min($this->calculateCompanyFontSize($company), 20);
        $jobFontPx = min($this->calculateJobTitleFontSize($jobTitle), 18);
        $eventTitleFontPx = min($this->calculateEventNameFontSize($eventName), 16);

        $eventHeaderBlock = '';
        if ($eventName !== '' || $eventDateDisplay !== '') {
            $eventTitleRow = $eventName !== ''
                ? '<div class="event-title" style="font-size:' . $eventTitleFontPx . 'px;">' . htmlspecialchars($eventName) . '</div>'
                : '';
            $eventDateRow = $eventDateDisplay !== ''
                ? '<div class="event-date">' . htmlspecialchars($eventDateDisplay) . '</div>'
                : '';
            $eventHeaderBlock = '<div class="event-header">' . $eventTitleRow . $eventDateRow . '</div>';
        }

        $companyBlock = $company !== ''
            ? '<div class="field company" style="font-size:' . $companyFontPx . 'px;">' . htmlspecialchars($company) . '</div>'
            : '';
        $jobBlock = $jobTitle !== ''
            ? '<div class="field job-title" style="font-size:' . $jobFontPx . 'px;">' . htmlspecialchars($jobTitle) . '</div>'
            : '';

        $qrSrc = trim((string) ($data['qrCodeImage'] ?? ''));
        if ($qrSrc === '') {
            $qrSrc = 'data:image/svg+xml;base64,' . base64_encode(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="16" fill="#000000">QR</text></svg>'
            );
        }

        $uuidBlock = $uuid !== ''
            ? '<div class="field uuid">' . htmlspecialchars($uuid) . '</div>'
            : '';

        $qrSizeMm = ! empty($data['leanPass']) ? 32 : 36;
        $contentTopMarginMm = ! empty($data['leanPass']) ? 12 : 20;

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Badge</title>
    <style>
        @page { margin: 0; size: 105mm 148mm; }
        html, body {
            margin: 0;
            padding: 0;
            width: 105mm;
            height: 148mm;
            overflow: hidden;
            font-family: Helvetica, Arial, sans-serif;
            background: #ffffff;
        }
        .badge {
            width: 105mm;
            height: 148mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            display: table;
            table-layout: fixed;
            border-collapse: collapse;
        }
        .badge-center {
            display: table-cell;
            vertical-align: top;
            text-align: center;
            padding: ' . $contentTopMarginMm . 'mm 5mm 4mm 5mm;
        }
        .content-stack {
            width: 100%;
            margin: 0 auto;
            text-align: center;
        }
        .event-header {
            margin: 0 auto 16px;
            padding: 0 0 8px;
            border-bottom: 1px solid #e5e7eb;
            max-width: 95mm;
        }
        .event-title {
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            margin: 0 0 3px;
            word-wrap: break-word;
        }
        .event-date {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            line-height: 1.2;
            margin: 0;
        }
        .field {
            margin: 0 auto 3px;
            padding: 0;
            line-height: 1.15;
            text-align: center;
            word-wrap: break-word;
        }
        .name {
            font-size: ' . $nameFontPx . 'px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
            margin-bottom: 5px;
        }
        .company {
            font-weight: 700;
            color: #334155;
        }
        .job-title {
            font-weight: 600;
            color: #64748b;
            margin-bottom: 6px;
        }
        .qr-wrap {
            margin: 5px auto;
            padding: 0;
            line-height: 0;
            width: ' . $qrSizeMm . 'mm;
            text-align: center;
        }
        .qr-image {
            width: ' . $qrSizeMm . 'mm;
            height: ' . $qrSizeMm . 'mm;
            display: block;
            margin: 0 auto;
        }
        .uuid {
            font-size: 12px;
            font-weight: 700;
            font-family: "Courier New", Courier, monospace;
            color: #1f2937;
            letter-spacing: 1px;
            margin: 5px auto 3px;
        }
        .guest-type {
            font-size: 20px;
            font-weight: 900;
            color: #e52521;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin: 3px auto 0;
        }
        ' . $this->getLogoFooterCss() . '
    </style>
</head>
<body>
    <div class="badge">
        <div class="badge-center">
            <div class="content-stack">
                ' . $eventHeaderBlock . '
                <div class="field name">' . htmlspecialchars($name !== '' ? $name : 'Guest') . '</div>
                ' . $companyBlock . '
                ' . $jobBlock . '
                <div class="qr-wrap">
                    <img src="' . $qrSrc . '" class="qr-image" alt="QR Code">
                </div>
                ' . $uuidBlock . '
                <div class="field guest-type"><strong>' . htmlspecialchars($guestType !== '' ? $guestType : 'Visitor') . '</strong></div>
                ' . $logoFooterBlock . '
            </div>
        </div>
    </div>
</body>
</html>';
    }

    private function calculateA6NameFontSize(string $name): int
    {
        if ($name === '') {
            return 26;
        }

        $length = strlen($name);

        if ($length <= 12) {
            return 30;
        }
        if ($length <= 20) {
            return 26;
        }
        if ($length <= 28) {
            return 22;
        }

        return 18;
    }

    private function formatEventDatesForBadge(Event $event): string
    {
        if (! $event->start_date && ! $event->end_date) {
            return '';
        }

        $start = $event->start_date ? \Carbon\Carbon::parse($event->start_date) : null;
        $end = $event->end_date ? \Carbon\Carbon::parse($event->end_date) : null;

        if ($start && $end) {
            if ($start->isSameDay($end)) {
                return $start->format('F j, Y');
            }
            if ($start->format('Y-m') === $end->format('Y-m')) {
                return $start->format('F j') . ' – ' . $end->format('j, Y');
            }

            return $start->format('F j, Y') . ' – ' . $end->format('F j, Y');
        }

        if ($start) {
            return $start->format('F j, Y');
        }

        return $end->format('F j, Y');
    }

    /**
     * Landscape Evella ticket badge (saved — switch getBadgeLayout() to BADGE_LAYOUT_TICKET).
     */
    private function generateTicketBadgeHtml(array $data): string
    {
        $dims = $this->getTicketDimensions();
        $widthPx = $dims['width_px'];
        $heightPx = $dims['height_px'];
        $bgUri = $this->getTicketBackgroundDataUri();

        $name = trim((string) ($data['name'] ?? ''));
        $company = trim((string) ($data['company'] ?? ''));
        $jobTitle = trim((string) ($data['jobTitle'] ?? ''));
        $eventName = trim((string) ($data['eventName'] ?? ''));
        $eventDate = trim((string) ($data['eventDate'] ?? ''));
        $eventLocation = trim((string) ($data['eventLocation'] ?? ''));
        $nameFontPx = $this->calculateNameFontSize($name);

        $companyBlock = $company !== ''
            ? '<div class="company" style="font-size:' . min($this->calculateCompanyFontSize($company), 32) . 'px;">' . htmlspecialchars($company) . '</div>'
            : '';
        $jobBlock = $jobTitle !== ''
            ? '<div class="job-title" style="font-size:' . min($this->calculateJobTitleFontSize($jobTitle), 28) . 'px;">' . htmlspecialchars($jobTitle) . '</div>'
            : '';

        $eventDetailsBlock = '';
        if ($eventName !== '' || $eventDate !== '' || $eventLocation !== '') {
            $eventNameFontPx = min($this->calculateEventNameFontSize($eventName), 26);
            $eventNameRow = $eventName !== ''
                ? '<div class="event-name" style="font-size:' . $eventNameFontPx . 'px;">' . htmlspecialchars($eventName) . '</div>'
                : '';
            $eventDateRow = $eventDate !== ''
                ? '<div class="event-date">' . htmlspecialchars($eventDate) . '</div>'
                : '';
            $eventLocationRow = $eventLocation !== ''
                ? '<div class="event-location">' . htmlspecialchars($eventLocation) . '</div>'
                : '';
            $eventDetailsBlock = '<div class="event-details">'
                . $eventNameRow
                . $eventDateRow
                . $eventLocationRow
                . '</div>';
        }

        $bgStyle = $bgUri !== ''
            ? 'background-image: url(' . $bgUri . '); background-size: 100% 100%; background-repeat: no-repeat; background-position: center;'
            : 'background: linear-gradient(90deg, #e52521 0%, #e52521 62%, #ececec 62%, #ececec 100%);';

        $uuid = trim((string) ($data['uuid'] ?? ''));
        $confirmationCode = trim((string) ($data['confirmationCode'] ?? $data['badgeId'] ?? ''));
        $ticketIdLabel = $uuid !== '' ? $uuid : $confirmationCode;
        $ticketIdBlock = $ticketIdLabel !== ''
            ? '<div class="ticket-id">' . htmlspecialchars($ticketIdLabel) . '</div>'
            : '';

        $qrSrc = trim((string) ($data['qrCodeImage'] ?? ''));
        if ($qrSrc === '') {
            $qrSrc = 'data:image/svg+xml;base64,' . base64_encode(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="16" fill="#000000">QR</text></svg>'
            );
        }

        $qrSizePx = (int) round($heightPx * 0.38);
        $ticketIdHeightPx = 40;
        $qrStackGapPx = 10;
        $qrStackHeightPx = $qrSizePx + $qrStackGapPx + $ticketIdHeightPx;
        $panelRightLeftPx = (int) round($widthPx * 0.62);
        $panelRightWidthPx = (int) round($widthPx * 0.38);
        $qrStackLeftPx = $panelRightLeftPx + (int) round(($panelRightWidthPx - $qrSizePx) / 2);
        $qrStackTopPx = (int) round(($heightPx - $qrStackHeightPx) / 2);
        $logoFooterBlock = $this->buildLogoFooterHtml($data, 'logo-footer-ticket');

        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Badge</title>
    <style>
        @page { margin: 0; size: ' . $widthPx . 'px ' . $heightPx . 'px landscape; }
        * { box-sizing: border-box; page-break-inside: avoid; page-break-after: avoid; page-break-before: avoid; }
        html, body {
            margin: 0;
            padding: 0;
            width: ' . $widthPx . 'px;
            height: ' . $heightPx . 'px;
            overflow: hidden;
            font-family: Helvetica, Arial, sans-serif;
        }
        .badge {
            width: ' . $widthPx . 'px;
            height: ' . $heightPx . 'px;
            position: relative;
            overflow: hidden;
            ' . $bgStyle . '
        }
        .panel-left {
            position: absolute;
            left: 0;
            top: 0;
            width: 62%;
            height: 100%;
            display: table;
            table-layout: fixed;
        }
        .panel-left-inner {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
            padding: 0 36px;
        }
        .name {
            font-size: ' . $nameFontPx . 'px;
            font-weight: 900;
            color: #ffffff;
            line-height: 1.1;
            margin: 0 0 12px;
            text-transform: uppercase;
            word-wrap: break-word;
        }
        .company {
            font-weight: 700;
            color: #ffffff;
            line-height: 1.2;
            margin: 0 0 6px;
            word-wrap: break-word;
            opacity: 0.95;
        }
        .job-title {
            font-weight: 600;
            color: #ffe8e8;
            line-height: 1.2;
            margin: 0;
            word-wrap: break-word;
        }
        .event-details {
            margin-top: 20px;
            padding-top: 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.35);
        }
        .event-name {
            font-weight: 700;
            color: #ffffff;
            line-height: 1.15;
            margin: 0 0 5px;
            word-wrap: break-word;
        }
        .event-date,
        .event-location {
            font-size: 18px;
            font-weight: 600;
            color: #ffe8e8;
            line-height: 1.2;
            margin: 0 0 6px;
            word-wrap: break-word;
        }
        .event-location {
            margin-bottom: 0;
        }
        .panel-right {
            position: absolute;
            right: 0;
            top: 0;
            width: 38%;
            height: 100%;
        }
        .qr-stack {
            position: absolute;
            top: ' . $qrStackTopPx . 'px;
            left: ' . $qrStackLeftPx . 'px;
            width: ' . $qrSizePx . 'px;
            text-align: center;
        }
        .qr-image {
            width: ' . $qrSizePx . 'px;
            height: ' . $qrSizePx . 'px;
            display: block;
            margin: 0 auto;
        }
        .ticket-id {
            margin-top: ' . $qrStackGapPx . 'px;
            font-size: 20px;
            font-weight: 700;
            font-family: "Courier New", Courier, monospace;
            color: #1f2937;
            letter-spacing: 1px;
            line-height: 1.2;
            word-wrap: break-word;
        }
        ' . $this->getLogoFooterCss('0') . '
    </style>
</head>
<body>
    <div class="badge">
        <div class="panel-left">
            <div class="panel-left-inner">
                <div class="name">' . htmlspecialchars($name !== '' ? $name : 'Guest') . '</div>
                ' . $companyBlock . '
                ' . $jobBlock . '
                ' . $eventDetailsBlock . '
            </div>
        </div>
        <div class="panel-right">
            <div class="qr-stack">
                <img src="' . $qrSrc . '" class="qr-image" alt="QR Code">
                ' . $ticketIdBlock . '
            </div>
        </div>
        ' . $logoFooterBlock . '
    </div>
</body>
</html>';
    }

    /**
     * Generate simple QR code data using only guest UUID (12 digits)
     * This matches the admin panel print functions for consistency
     */
    private function generateSimpleQrData(Attendee $attendee, Event $event): string
    {
        $guest = $attendee->guest;

        // Use only the guest's UUID (first 12 characters) for QR code
        $uuid = $guest->uuid ?? $guest->id ?? '';
        return substr($uuid, 0, 12);
    }

    /**
     * Generate unified QR code data that matches frontend badge generation
     * This ensures consistency between printed badges and email confirmation badges
     */
    private function generateUnifiedQrData(Attendee $attendee, Event $event): string
    {
        $guest = $attendee->guest;
        $guestType = $attendee->guestType;

        // Use the same comprehensive data structure for both frontend and backend
        return json_encode([
            'type' => 'event_confirmation',
            'attendee_id' => $attendee->id,
            'event_id' => $event->id,
            'event_name' => $event->name,
            'guest_name' => $guest->name ?? '',
            'guest_email' => $guest->email ?? '',
            'guest_phone' => $guest->phone ?? '',
            'company' => $guest->company ?? '',
            'job_title' => $guest->jobtitle ?? '',
            'guest_type' => $guestType ? $guestType->name : 'Visitor',
            'event_date' => $event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('Y-m-d H:i:s') : '',
            'event_location' => $event->location ?? '',
            'registration_date' => $attendee->created_at ? $attendee->created_at->format('Y-m-d H:i:s') : '',
            'confirmation_code' => 'REG-' . str_pad($attendee->id, 8, '0', STR_PAD_LEFT),
            'qr_version' => '2.0', // Updated version for unified system
            'uuid' => $guest->uuid ?? $guest->id ?? '', // Add UUID for frontend compatibility
        ]);
    }

    /**
     * Get the QR value using only guest UUID (12 digits)
     * This matches the admin panel print functions for consistency
     */
    private function getQrValue(Attendee $attendee, Event $event): string
    {
        return $this->generateSimpleQrData($attendee, $event);
    }

    /**
     * Get unified badge data structure for API consistency
     * This method can be used by frontend to get the same badge data as backend
     */
    public function getUnifiedBadgeData(Attendee $attendee, Event $event): array
    {
        $guest = $attendee->guest;
        $guestType = $attendee->guestType;
        $confirmationCode = 'REG-' . str_pad($attendee->id, 8, '0', STR_PAD_LEFT);

        return [
            'name' => $guest->name ?? '',
            'company' => $guest->company ?? '',
            'jobTitle' => $guest->jobtitle ?? '',
            'country' => $guest->country ?? '',
            'guestType' => $guestType ? $guestType->name : 'Visitor',
            'eventName' => $event->name,
            'eventDate' => $event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('F j, Y') : '',
            'eventDateDisplay' => $this->formatEventDatesForBadge($event),
            'eventLocation' => $event->location ?? '',
            'badgeId' => $confirmationCode,
            'confirmationCode' => $confirmationCode,
            'attendeeId' => $attendee->id,
            'uuid' => substr($guest->uuid ?? $guest->id ?? '', 0, 12), // First 12 characters only
            'qrValue' => $this->getQrValue($attendee, $event),
            'qrData' => $this->generateSimpleQrData($attendee, $event),
        ];
    }

    /**
     * Generate a text-based badge when GD extension is not available
     */
    private function generateTextBasedBadge(Attendee $attendee, Event $event): string
    {
        try {
            $guest = $attendee->guest;
            $guestType = $attendee->guestType;
            $confirmationCode = 'REG-' . str_pad($attendee->id, 8, '0', STR_PAD_LEFT);

            // Generate QR data for text display
            $qrData = $this->generateSimpleQrData($attendee, $event);

            // Create HTML for text-based badge
            $html = '
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 0;
                        background: white;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        height: 100vh;
                        width: 100vw;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        overflow: hidden;
                    }
                    * {
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                    }
                    .badge { 
                        width: 400px; 
                        height: 400px; 
                        padding: 20px 15px; 
                        box-sizing: border-box;
                        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        text-align: center;
                        position: relative;
                        page-break-inside: avoid;
                        page-break-after: avoid;
                        page-break-before: avoid;
                        margin: 50px auto;
                        border-radius: 0;
                        box-shadow: none;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .header { 
                        font-size: 24px; 
                        font-weight: bold; 
                        color: #333; 
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .event-name { 
                        font-size: 18px; 
                        color: #666; 
                        margin-bottom: 20px;
                        font-weight: bold;
                    }
                    .name { 
                        font-size: 28px; 
                        font-weight: bold; 
                        color: #000; 
                        margin: 20px 0;
                        text-transform: uppercase;
                    }
                    .company { 
                        font-size: 16px; 
                        color: #555; 
                        margin-bottom: 10px;
                    }
                    .job-title { 
                        font-size: 14px; 
                        color: #777; 
                        margin-bottom: 20px;
                        font-style: italic;
                    }
                    .guest-type { 
                        font-size: 18px; 
                        color: white; 
                        margin-bottom: 20px;
                        font-weight: bold;
                        background: #003388;
                        padding: 10px 20px;
                        border-radius: 8px;
                        text-align: center;
                        text-transform: uppercase;
                    }
                    .qr-section {
                        margin-top: 30px;
                        padding: 15px;
                        background: white;
                        border: 2px dashed #ccc;
                        border-radius: 10px;
                    }
                    .qr-label {
                        font-size: 12px;
                        color: #666;
                        margin-bottom: 10px;
                    }
                    .qr-code {
                        font-family: monospace;
                        font-size: 10px;
                        color: #333;
                        word-break: break-all;
                        line-height: 1.2;
                    }
                    .confirmation-code {
                        font-size: 14px;
                        font-weight: bold;
                        color: #000;
                        margin-top: 10px;
                        background: #f0f0f0;
                        padding: 5px;
                        border-radius: 3px;
                    }
                    .footer {
                        position: absolute;
                        bottom: 10px;
                        left: 20px;
                        right: 20px;
                        font-size: 10px;
                        color: #666;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="badge">
                    <div class="header">EVENT BADGE</div>
                    <div class="event-name">' . htmlspecialchars($event->name) . '</div>
                    
                    <div class="name">' . htmlspecialchars($guest->name ?? 'Guest') . '</div>
                    
                    <div class="company">' . htmlspecialchars($guest->company ?? '') . '</div>
                    <div class="job-title">' . htmlspecialchars($guest->jobtitle ?? '') . '</div>
                    
                    <div class="guest-type">' . htmlspecialchars($guestType ? $guestType->name : 'Visitor') . '</div>
                    
                    <div class="qr-section">
                        <div class="qr-label">QR CODE DATA:</div>
                        <div class="qr-code">' . htmlspecialchars($qrData) . '</div>
                        <div class="confirmation-code">ID: ' . $confirmationCode . '</div>
                    </div>
                    
                    <div class="footer">
                        ' . ($event->start_date ? \Carbon\Carbon::parse($event->start_date)->format('M j, Y') : '') . '
                    </div>
                </div>
            </body>
            </html>';

            $pdf = Pdf::loadHTML($html);
            $this->configureA6Pdf($pdf);

            return $pdf->output();

        } catch (\Exception $e) {
            Log::error('Text-based badge generation failed: ' . $e->getMessage());
            throw new \Exception('Text-based badge generation failed: ' . $e->getMessage());
        }
    }

    /**
     * Get cached QR code if exists
     */
    private function getCachedQrCode(string $cacheKey): ?string
    {
        try {
            $cachePath = "qr-codes/{$cacheKey}.txt";

            if (Storage::disk('local')->exists($cachePath)) {
                return Storage::disk('local')->get($cachePath);
            }

            return null;
        } catch (\Exception $e) {
            Log::warning('Failed to retrieve cached QR code: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Cache QR code data
     */
    private function cacheQrCode(string $cacheKey, string $qrData): void
    {
        try {
            $cachePath = "qr-codes/{$cacheKey}.txt";

            // Ensure directory exists
            Storage::disk('local')->makeDirectory('qr-codes');

            // Store QR code data
            Storage::disk('local')->put($cachePath, $qrData);

            Log::info('QR code cached', ['cache_key' => $cacheKey, 'cache_path' => $cachePath]);
        } catch (\Exception $e) {
            Log::warning('Failed to cache QR code: ' . $e->getMessage());
        }
    }
}