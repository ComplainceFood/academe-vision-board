import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TermsOfService = () => {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Terms of Service</CardTitle>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96 w-full">
          <div className="space-y-6 pr-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-sm leading-6">
                By accessing or using Smart-Prof, you agree to be bound by these Terms of Service 
                and our Privacy Policy. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Description of Service</h3>
              <p className="text-sm leading-6">
                Smart-Prof is an academic management platform that helps educators and researchers 
                organize their academic activities, including:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Note-taking and organization</li>
                <li>Meeting and event scheduling</li>
                <li>Supply and resource management</li>
                <li>Funding tracking and reporting</li>
                <li>Communication and collaboration tools</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. User Accounts and Responsibilities</h3>
              <p className="text-sm leading-6">To use our service, you must:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your account information when necessary</li>
                <li>Use the service in compliance with applicable laws and regulations</li>
                <li>Not share your account with others or allow unauthorized access</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Acceptable Use Policy</h3>
              <p className="text-sm leading-6">You agree not to:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Use the service for any unlawful or prohibited purpose</li>
                <li>Upload, post, or share content that is harmful, offensive, or inappropriate</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Use automated means to access the service without permission</li>
                <li>Violate any applicable local, state, national, or international law</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Intellectual Property Rights</h3>
              <p className="text-sm leading-6">
                Smart-Prof and its original content, features, and functionality are owned by us and 
                are protected by intellectual property laws. You retain ownership of content you create 
                and upload, but grant us a license to use it as necessary to provide our services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Data Backup and Loss</h3>
              <p className="text-sm leading-6">
                While we implement backup procedures, you are responsible for maintaining your own 
                backups of important data. We are not liable for any data loss, corruption, or 
                unauthorized access to your information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Service Availability</h3>
              <p className="text-sm leading-6">
                We strive to provide continuous service availability but do not guarantee uninterrupted 
                access. We may temporarily suspend service for maintenance, updates, or other reasons 
                with reasonable notice when possible.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">8. Limitation of Liability</h3>
              <p className="text-sm leading-6">
                To the maximum extent permitted by law, we shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of 
                the service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">9. Termination</h3>
              <p className="text-sm leading-6">
                We may terminate or suspend your account and access to the service immediately, 
                without prior notice, for conduct that we believe violates these Terms of Service 
                or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">10. Changes to Terms</h3>
              <p className="text-sm leading-6">
                We reserve the right to modify these terms at any time. We will notify you of 
                significant changes via email or through our service. Your continued use of the 
                service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">11. Contact Information</h3>
              <p className="text-sm leading-6">
                If you have any questions about these Terms of Service, please contact us at 
                legal@smart-prof.com or through our support channels.
              </p>
            </section>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};