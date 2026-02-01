import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, Key } from 'lucide-react'

interface PasswordResetDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: number | null
    userName?: string
    onSuccess?: () => void
}

export function PasswordResetDialog({
    open,
    onOpenChange,
    userId,
    userName,
    onSuccess,
}: PasswordResetDialogProps) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        try {
            setLoading(true)
            await api.post(`/users/${userId}/reset-password`, {
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            })
            toast.success('Password reset successfully')
            setNewPassword('')
            setConfirmPassword('')
            onOpenChange(false)
            if (onSuccess) onSuccess()
        } catch (err: any) {
            console.error('Failed to reset password:', err)
            toast.error(err.response?.data?.message || err.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-primary" />
                        Reset Password
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        Resetting password for <span className="font-medium text-foreground">{userName || 'User'}</span>.
                        The user will be logged out from all devices.
                    </p>

                    <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="reset-password-form" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Reset Password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
