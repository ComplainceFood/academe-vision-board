import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Privacy Policy</CardTitle>
        <p className="text-sm text-muted-foreground">Last updated: March 29, 2026</p>
      </CardHeader>
      <CardContent>
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-sm leading-6">
                We collect information you provide directly to us, such as when you create an account, 
                update your profile, use our services, or communicate with us. This includes:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Personal information (name, email address, phone number)</li>
                <li>Profile information (department, position, bio, office location)</li>
                <li>Academic data (courses, notes, meetings, supplies, funding information)</li>
                <li>Usage data (how you interact with our platform)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
              <p className="text-sm leading-6">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Send you notifications and communications based on your preferences</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze usage patterns to improve user experience</li>
                <li>Ensure the security and integrity of our platform</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Information Sharing and Disclosure</h3>
              <p className="text-sm leading-6">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share your information:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist us in operating our platform</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
              <p className="text-sm leading-6">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication measures</li>
                <li>Secure backup and recovery procedures</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Your Rights and Choices</h3>
              <p className="text-sm leading-6">You have the right to:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Access, update, or delete your personal information</li>
                <li>Control your notification preferences</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for data processing</li>
                <li>Request restriction of processing</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Data Retention</h3>
              <p className="text-sm leading-6">
                We retain your personal information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements. When you 
                delete your account, we will delete your personal information within 30 days, unless 
                required to retain it for legal or security purposes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Contact Us</h3>
              <p className="text-sm leading-6">
                If you have any questions about this Privacy Policy or our data practices, please 
                contact us at privacy@smart-prof.com or through our support channels.
              </p>
            </section>
          </div>
      </CardContent>
    </Card>
    </div>
  );
};