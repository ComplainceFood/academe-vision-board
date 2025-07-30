import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { TermsOfService } from "./TermsOfService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LegalAgreementProps {
  onAgreementComplete: () => void;
  showDialog?: boolean;
}

export const LegalAgreement = ({ onAgreementComplete, showDialog = true }: LegalAgreementProps) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      toast({
        title: "Agreement Required",
        description: "Please agree to both the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no authenticated user, just complete the agreement flow
        // This handles cases where agreements are collected before authentication
        toast({
          title: "Agreements Acknowledged",
          description: "Your preferences have been noted and will be recorded upon account creation.",
        });
        onAgreementComplete();
        return;
      }

      // Record user agreements in the database
      const agreementPromises = [
        supabase.from('user_agreements').insert({
          user_id: user.id,
          agreement_type: 'terms_of_service',
          version: '1.0',
          ip_address: null, // Could be obtained via API if needed
          user_agent: navigator.userAgent,
        }),
        supabase.from('user_agreements').insert({
          user_id: user.id,
          agreement_type: 'privacy_policy',
          version: '1.0',
          ip_address: null,
          user_agent: navigator.userAgent,
        })
      ];

      const results = await Promise.all(agreementPromises);
      
      // Check for errors
      results.forEach((result, index) => {
        if (result.error) {
          console.error(`Error recording agreement ${index}:`, result.error);
          throw result.error;
        }
      });

      toast({
        title: "Agreements Recorded",
        description: "Your legal agreements have been successfully recorded.",
      });

      onAgreementComplete();
    } catch (error: any) {
      console.error('Error recording agreements:', error);
      toast({
        title: "Error",
        description: "Failed to record legal agreements. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showDialog) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-primary underline hover:no-underline"
              >
                Terms of Service
              </button>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={agreedToPrivacy}
              onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
            />
            <label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="text-primary underline hover:no-underline"
              >
                Privacy Policy
              </button>
            </label>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!agreedToTerms || !agreedToPrivacy || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Recording Agreements..." : "Continue"}
        </Button>

        {/* Terms Dialog */}
        <Dialog open={showTerms} onOpenChange={setShowTerms}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
              <DialogDescription>
                Please review our terms of service before continuing.
              </DialogDescription>
            </DialogHeader>
            <TermsOfService />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowTerms(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Dialog */}
        <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
              <DialogDescription>
                Please review our privacy policy before continuing.
              </DialogDescription>
            </DialogHeader>
            <PrivacyPolicy />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowPrivacy(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
        <Dialog open={showDialog} onOpenChange={() => {}}>
          <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Legal Agreements</DialogTitle>
              <DialogDescription>
                Please review and accept our legal agreements to continue using Smart-Prof.
              </DialogDescription>
            </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms-dialog"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <label htmlFor="terms-dialog" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-primary underline hover:no-underline"
                >
                  Terms of Service
                </button>
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy-dialog"
                checked={agreedToPrivacy}
                onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
              />
              <label htmlFor="privacy-dialog" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-primary underline hover:no-underline"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!agreedToTerms || !agreedToPrivacy || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Recording Agreements..." : "Accept and Continue"}
          </Button>
        </div>

        {/* Terms Dialog */}
        <Dialog open={showTerms} onOpenChange={setShowTerms}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
              <DialogDescription>
                Please review our terms of service before continuing.
              </DialogDescription>
            </DialogHeader>
            <TermsOfService />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowTerms(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Privacy Dialog */}
        <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
              <DialogDescription>
                Please review our privacy policy before continuing.
              </DialogDescription>
            </DialogHeader>
            <PrivacyPolicy />
            <div className="flex justify-end mt-4">
              <Button onClick={() => setShowPrivacy(false)} variant="outline">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};