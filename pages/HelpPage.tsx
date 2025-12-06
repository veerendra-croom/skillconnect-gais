
import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'General',
    question: 'Is SkillConnect free to use?',
    answer: 'Yes, searching for professionals is completely free for customers. Workers pay a small commission only on completed jobs.'
  },
  {
    category: 'Booking',
    question: 'How do I cancel a booking?',
    answer: 'You can cancel a booking from your Dashboard before the worker arrives. If the worker is already on the way, a small cancellation fee may apply.'
  },
  {
    category: 'Trust & Safety',
    question: 'Are the professionals verified?',
    answer: 'Absolutely. Every worker on SkillConnect undergoes a mandatory background check and Government ID verification before they can accept jobs.'
  },
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major UPI apps (GPay, PhonePe), Credit/Debit cards, and Cash on Completion.'
  },
  {
    category: 'Workers',
    question: 'How do I join as a professional?',
    answer: 'Simply sign up, select "Worker" as your role, complete your profile, and upload your ID. Once verified by our admin team (usually within 24 hours), you can start accepting jobs.'
  }
];

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Header */}
      <div className="bg-blue-600 text-white py-16 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">How can we help?</h1>
        <div className="max-w-2xl mx-auto relative">
          <Input 
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 text-gray-900 shadow-xl border-0"
            icon={<Search className="text-gray-400" />}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Card 
                key={index} 
                className={`transition-all duration-300 cursor-pointer ${openIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                noPadding
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <div className="p-6 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">{faq.question}</h3>
                  {openIndex === index ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-gray-400" />}
                </div>
                {openIndex === index && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
