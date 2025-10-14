import { vendorReferralApi } from './vendorReferralApi';

export interface ReferralTrackingData {
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  metadata?: Record<string, any>;
}

class ReferralTrackingService {
  private static instance: ReferralTrackingService;
  private referralData: ReferralTrackingData | null = null;

  private constructor() {
    this.initializeTracking();
  }

  public static getInstance(): ReferralTrackingService {
    if (!ReferralTrackingService.instance) {
      ReferralTrackingService.instance = new ReferralTrackingService();
    }
    return ReferralTrackingService.instance;
  }

  /**
   * Initialize referral tracking from URL parameters and localStorage
   */
  private initializeTracking(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      this.setReferralCode(referralCode);
    }

    // Extract UTM parameters
    const utmParams = {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmContent: urlParams.get('utm_content') || undefined,
      utmTerm: urlParams.get('utm_term') || undefined,
    };

    if (Object.values(utmParams).some(param => param !== undefined)) {
      this.setUtmParams(utmParams);
    }

    // Load from localStorage if available
    const storedData = localStorage.getItem('referral_tracking_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        this.referralData = { ...this.referralData, ...parsed };
      } catch (error) {
        console.error('Failed to parse stored referral data:', error);
      }
    }
  }

  /**
   * Set referral code
   */
  public setReferralCode(code: string): void {
    this.referralData = {
      ...this.referralData,
      referralCode: code,
    };
    this.saveToStorage();
  }

  /**
   * Set UTM parameters
   */
  public setUtmParams(params: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  }): void {
    this.referralData = {
      ...this.referralData,
      ...params,
    };
    this.saveToStorage();
  }

  /**
   * Set additional metadata
   */
  public setMetadata(metadata: Record<string, any>): void {
    this.referralData = {
      ...this.referralData,
      metadata: {
        ...this.referralData?.metadata,
        ...metadata,
      },
    };
    this.saveToStorage();
  }

  /**
   * Get current referral data
   */
  public getReferralData(): ReferralTrackingData | null {
    return this.referralData;
  }

  /**
   * Check if there's an active referral
   */
  public hasReferral(): boolean {
    return !!this.referralData?.referralCode;
  }

  /**
   * Get referral code
   */
  public getReferralCode(): string | undefined {
    return this.referralData?.referralCode;
  }

  /**
   * Track link click activity
   */
  public async trackLinkClick(): Promise<void> {
    if (!this.referralData?.referralCode) return;

    try {
      await vendorReferralApi.trackActivity({
        referral_code: this.referralData.referralCode,
        activity_type: 'link_click',
        utm_source: this.referralData.utmSource,
        utm_medium: this.referralData.utmMedium,
        utm_campaign: this.referralData.utmCampaign,
        utm_content: this.referralData.utmContent,
        utm_term: this.referralData.utmTerm,
        metadata: this.referralData.metadata,
      });
    } catch (error) {
      console.error('Failed to track link click:', error);
    }
  }

  /**
   * Track registration activity
   */
  public async trackRegistration(guestId?: number, attendeeId?: number): Promise<void> {
    if (!this.referralData?.referralCode) return;

    try {
      await vendorReferralApi.trackActivity({
        referral_code: this.referralData.referralCode,
        activity_type: 'registration',
        guest_id: guestId,
        attendee_id: attendeeId,
        utm_source: this.referralData.utmSource,
        utm_medium: this.referralData.utmMedium,
        utm_campaign: this.referralData.utmCampaign,
        utm_content: this.referralData.utmContent,
        utm_term: this.referralData.utmTerm,
        metadata: this.referralData.metadata,
      });
    } catch (error) {
      console.error('Failed to track registration:', error);
    }
  }

  /**
   * Track ticket purchase activity
   */
  public async trackTicketPurchase(
    guestId?: number, 
    attendeeId?: number, 
    ticketAmount?: number
  ): Promise<void> {
    if (!this.referralData?.referralCode) return;

    try {
      await vendorReferralApi.trackActivity({
        referral_code: this.referralData.referralCode,
        activity_type: 'ticket_purchase',
        guest_id: guestId,
        attendee_id: attendeeId,
        ticket_amount: ticketAmount,
        utm_source: this.referralData.utmSource,
        utm_medium: this.referralData.utmMedium,
        utm_campaign: this.referralData.utmCampaign,
        utm_content: this.referralData.utmContent,
        utm_term: this.referralData.utmTerm,
        metadata: this.referralData.metadata,
      });
    } catch (error) {
      console.error('Failed to track ticket purchase:', error);
    }
  }

  /**
   * Track event attendance
   */
  public async trackEventAttendance(guestId?: number, attendeeId?: number): Promise<void> {
    if (!this.referralData?.referralCode) return;

    try {
      await vendorReferralApi.trackActivity({
        referral_code: this.referralData.referralCode,
        activity_type: 'event_attendance',
        guest_id: guestId,
        attendee_id: attendeeId,
        utm_source: this.referralData.utmSource,
        utm_medium: this.referralData.utmMedium,
        utm_campaign: this.referralData.utmCampaign,
        utm_content: this.referralData.utmContent,
        utm_term: this.referralData.utmTerm,
        metadata: this.referralData.metadata,
      });
    } catch (error) {
      console.error('Failed to track event attendance:', error);
    }
  }

  /**
   * Save referral data to localStorage
   */
  private saveToStorage(): void {
    if (this.referralData) {
      localStorage.setItem('referral_tracking_data', JSON.stringify(this.referralData));
    }
  }

  /**
   * Clear referral data
   */
  public clearReferralData(): void {
    this.referralData = null;
    localStorage.removeItem('referral_tracking_data');
  }

  /**
   * Generate referral link for sharing
   */
  public generateReferralLink(baseUrl: string, referralCode: string, additionalParams?: Record<string, string>): string {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', referralCode);
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Get referral attribution info for display
   */
  public getAttributionInfo(): {
    hasReferral: boolean;
    referralCode?: string;
    utmSource?: string;
    utmCampaign?: string;
  } {
    return {
      hasReferral: this.hasReferral(),
      referralCode: this.getReferralCode(),
      utmSource: this.referralData?.utmSource,
      utmCampaign: this.referralData?.utmCampaign,
    };
  }
}

// Export singleton instance
export const referralTracking = ReferralTrackingService.getInstance();

// React hook for using referral tracking
export function useReferralTracking() {
  return {
    referralData: referralTracking.getReferralData(),
    hasReferral: referralTracking.hasReferral(),
    referralCode: referralTracking.getReferralCode(),
    attributionInfo: referralTracking.getAttributionInfo(),
    trackLinkClick: () => referralTracking.trackLinkClick(),
    trackRegistration: (guestId?: number, attendeeId?: number) => 
      referralTracking.trackRegistration(guestId, attendeeId),
    trackTicketPurchase: (guestId?: number, attendeeId?: number, ticketAmount?: number) => 
      referralTracking.trackTicketPurchase(guestId, attendeeId, ticketAmount),
    trackEventAttendance: (guestId?: number, attendeeId?: number) => 
      referralTracking.trackEventAttendance(guestId, attendeeId),
    setMetadata: (metadata: Record<string, any>) => referralTracking.setMetadata(metadata),
    clearReferralData: () => referralTracking.clearReferralData(),
  };
}


