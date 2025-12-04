
import React from 'react';
import { Card } from './common/Card.tsx';

export const Support: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">System Features</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">Tidé Hotels PMS Capabilities</p>
      </div>

      {/* 3. Core Functional Modules */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Core Functional Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Reservations">
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Individual & group bookings</li>
                    <li>Complex negotiated rates</li>
                    <li>Long-stay billing</li>
                    <li>Availability management</li>
                    <li>Automated distribution across channels</li>
                </ul>
            </Card>
            <Card title="Profile Management">
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Guest preferences</li>
                    <li>Guest history</li>
                    <li>Corporate/travel agent profiles</li>
                    <li>Personalized experiences</li>
                </ul>
            </Card>
            <Card title="Front Desk Operations">
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Check-in / check-out</li>
                    <li>Room assignment</li>
                    <li>Guest requests & in-house management</li>
                </ul>
            </Card>
            <Card title="Cashiering & Billing">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Charge posting</li>
                    <li>Folio settlement</li>
                    <li>Multiple payment types</li>
                    <li>POS/PMS integration</li>
                    <li>Apartment-style billing</li>
                </ul>
            </Card>
            <Card title="Room Mgmt & Housekeeping">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Room status updates</li>
                    <li>Housekeeping sections</li>
                    <li>Maintenance tracking</li>
                    <li>Facility management</li>
                </ul>
            </Card>
            <Card title="Accounts Receivable">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>City ledger</li>
                    <li>Billing for corporate & groups</li>
                </ul>
            </Card>
             <Card title="Commissions Management">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>OTA & travel agent commissions</li>
                </ul>
            </Card>
            <Card title="Back-Office Export">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Integration with accounting systems</li>
                </ul>
            </Card>
            <Card title="Reports & Analytics">
                 <ul className="list-disc list-inside text-sm space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Forecasting</li>
                    <li>Operational reports</li>
                    <li>Financial performance</li>
                </ul>
            </Card>
        </div>
      </section>

      {/* Advanced Management & Integrations */}
      <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Advanced Management & Integrations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Revenue & Rate Management">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>Dynamic rate updates</li>
                      <li>Upsell opportunities</li>
                      <li>Corporate and negotiated rates</li>
                      <li>Automation of pricing changes</li>
                  </ul>
              </Card>
              <Card title="Distribution Strategy Tools">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>OTAs (Online Travel Agents)</li>
                      <li>Global Distribution Systems (GDS)</li>
                      <li>Hotel website booking engine</li>
                      <li>Metasearch platforms</li>
                      <li>Automated rate & availability updates</li>
                  </ul>
              </Card>
              <Card title="Integration Capabilities">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>Leading POS Systems</li>
                      <li>Kitchen management</li>
                      <li>Loyalty / membership programs</li>
                      <li>Event & catering systems</li>
                      <li>Financial software</li>
                      <li>3rd-party hardware: ID scanners, signature pads, kiosk interfaces</li>
                  </ul>
              </Card>
          </div>
      </section>

      {/* Scalability & Security */}
      <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Scalability & Security</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Mobile Functionality">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>Perform check-ins via mobile</li>
                      <li>Update housekeeping</li>
                      <li>Record maintenance issues</li>
                      <li>Deliver service anywhere on property</li>
                      <li>Enables “borderless hotels”</li>
                  </ul>
              </Card>
              <Card title="Multi-Property Support">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>Central profiles</li>
                      <li>Central configuration</li>
                      <li>Cross-property reservations</li>
                      <li>Cross-postings (optional add-on)</li>
                  </ul>
              </Card>
              <Card title="Security & Compliance">
                  <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                      <li>Strong data security</li>
                      <li>PCI-compliant payment processing</li>
                      <li>Protected guest information</li>
                      <li>Reduced risk of compliance failures</li>
                  </ul>
              </Card>
          </div>
      </section>

       {/* Inventory - New Section */}
      <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Inventory & Logistics</h2>
          <Card title="Inventory & Stock Management">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Housekeeping & Amenities</h3>
                     <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                        <li>Real-time tracking of linens, toiletries, and cleaning supplies</li>
                        <li>Automated low-stock alerts and reorder suggestions</li>
                        <li>Usage tracking per room or floor</li>
                    </ul>
                </div>
                <div>
                     <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Food & Beverage (F&B)</h3>
                     <ul className="list-disc list-inside text-sm space-y-2 text-slate-700 dark:text-slate-300">
                        <li>Ingredient level inventory tracking for Kitchen</li>
                        <li>Bar stock management (bottles, kegs, mixers)</li>
                        <li>Supplier management and purchase order generation</li>
                        <li>Expiry date tracking to minimize waste</li>
                    </ul>
                </div>
            </div>
          </Card>
      </section>
    </div>
  );
};
