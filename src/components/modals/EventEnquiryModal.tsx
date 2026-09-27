import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Users, Mail, Phone, Clock } from 'lucide-react';
import { VentyLogo } from '../VentyLogo';

interface EventEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventEnquiryModal: React.FC<EventEnquiryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [eventType, setEventType] = useState('Evening Gathering');
  const [guestCount, setGuestCount] = useState('10-20');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [refCode, setRefCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `VENTY-EVT-${Math.floor(100 + Math.random() * 900)}`;
    setRefCode(code);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#faf6ef] border border-[#ded7c8] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#221a14]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#ded7c8] flex items-center justify-between bg-[#faf6ef]">
          <div className="flex items-center gap-3">
            <VentyLogo
              className="h-9 w-auto max-w-[140px]"
              imgClassName="h-full w-auto max-h-9 max-w-[140px] object-contain block"
            />
            <div>
              <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#8a7b70] block">
                Soufay, RN14 · Miliana
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#221a14]">
                {submitted ? 'Enquiry Received' : 'Enjoy the Space'}
              </h3>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[#7a6b61] hover:text-[#221a14] hover:bg-[#eee9de] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#c9833a]/20 text-[#6b3a1f] flex items-center justify-center mx-auto rounded-full">
                <CheckCircle2 className="w-10 h-10 text-[#6b3a1f]" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-[#8a7b70] font-sans font-medium">
                  Reference: {refCode}
                </span>
                <h4 className="font-serif font-bold text-2xl text-[#221a14] mt-1">
                  Thank you, {name}!
                </h4>
                <p className="font-sans text-sm text-[#59493f] max-w-md mx-auto mt-2 leading-relaxed">
                  The Venty team has received your enquiry for <strong>{eventType}</strong>. We will get back to you at <strong>{phone || email}</strong> shortly.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleClose}
                  className="bg-[#6b3a1f] text-[#faf6ef] px-8 py-3 text-sm font-medium hover:bg-[#532c17] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Type selector */}
              <div>
                <label className="block font-sans text-xs font-medium uppercase tracking-wider text-[#59493f] mb-2">
                  Gathering Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Evening Gathering',
                    'Birthday Celebration',
                    'Coffee & Sweets Table',
                    'Group Meetup',
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventType(type)}
                      className={`p-2.5 text-xs text-left border transition-all ${
                        eventType === type
                          ? 'border-[#6b3a1f] bg-[#6b3a1f] text-[#faf6ef]'
                          : 'border-[#ded7c8] bg-white text-[#59493f] hover:bg-[#eee9de]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Count & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-[#c9833a]" />
                    Estimated Guests
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                  >
                    <option value="4-8">4–8 guests (Small table)</option>
                    <option value="8-15">8–15 guests</option>
                    <option value="15-30">15–30 guests (Terrace / Group)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1 text-[#c9833a]" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                  />
                </div>

                <div>
                  <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0569055916"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                />
              </div>

              <div>
                <label className="block font-sans text-xs font-medium text-[#59493f] mb-1">
                  Notes / Special Requests (e.g. Cheesecake order, drink pairings)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your gathering..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ded7c8] bg-white text-sm focus:outline-none focus:border-[#6b3a1f]"
                />
              </div>

              <div className="pt-3 border-t border-[#ded7c8] flex items-center justify-between">
                <span className="text-xs text-[#8a7b70]">
                  Open daily 17:00 – 1:00 in Miliana
                </span>
                <button
                  type="submit"
                  className="bg-[#6b3a1f] hover:bg-[#532c17] text-[#faf6ef] px-6 py-2.5 text-sm font-medium transition-all active:scale-[0.98] cursor-pointer"
                >
                  Send Enquiry →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
