'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { SUBSCRIPTION_FAQ } from './subscriptionPlans';

export function SubscriptionFaq() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">Frequently asked questions</h3>
        <p className="mt-1 text-sm text-slate-600">Billing, upgrades, and cancellations</p>
      </div>
      <Accordion type="single" collapsible className="px-6">
        {SUBSCRIPTION_FAQ.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`} className="border-slate-200">
            <AccordionTrigger className="text-left text-slate-900 hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-slate-600">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
