
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const ContactPage: React.FC = () => {
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      addToast('Message sent! We will get back to you shortly.', 'success');
      setName('');
      setEmail('');
      setMessage('');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
        <p className="text-gray-500 text-lg">
          Have a question or need assistance? Our support team is here to help you 24/7.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Contact Info */}
        <div className="md:col-span-1 space-y-6">
          <Card glass className="p-6 border-l-4 border-l-blue-500">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Call Us</h3>
            <p className="text-gray-500 mb-2">Mon-Fri from 8am to 5pm.</p>
            <a href="tel:+919876543210" className="text-blue-600 font-bold hover:underline">+91 98765 43210</a>
          </Card>

          <Card glass className="p-6 border-l-4 border-l-purple-500">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-4">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Email Support</h3>
            <p className="text-gray-500 mb-2">We typically reply within 2 hours.</p>
            <a href="mailto:support@skillconnect.com" className="text-purple-600 font-bold hover:underline">support@skillconnect.com</a>
          </Card>

          <Card glass className="p-6 border-l-4 border-l-emerald-500">
            <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <MapPin size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Headquarters</h3>
            <p className="text-gray-500">
              123 Innovation Drive,<br/>
              Tech Park, Sector 5,<br/>
              Bangalore, India 560100
            </p>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input 
                  label="Your Name" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input 
                  label="Email Address" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5 ml-1">Message</label>
                <textarea 
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                  rows={6}
                  placeholder="How can we help you today?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="shadow-lg shadow-blue-500/30"
                  isLoading={loading}
                >
                  <Send size={18} className="mr-2" /> Send Message
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
