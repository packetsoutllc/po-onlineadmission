import React, { useState, useEffect, useCallback } from 'react';
import { ServiceCategory, SubService } from '../types';

interface ServiceModalProps {
  service: ServiceCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'processing' | 'success';

const ServiceModal: React.FC<ServiceModalProps> = ({ service, isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('form');
  const [selectedSubService, setSelectedSubService] = useState<SubService | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [generatedVoucher, setGeneratedVoucher] = useState('');
  const [formError, setFormError] = useState('');

  const resetState = useCallback(() => {
    setStep('form');
    setSelectedSubService(service?.subServices[0] || null);
    setFullName('');
    setPhone('');
    setEmail('');
    setGeneratedVoucher('');
    setFormError('');
  }, [service]);

  useEffect(() => {
    if (isOpen && service) {
      resetState();
    }
  }, [isOpen, service, resetState]);
  
  if (!isOpen || !service) return null;

  const handleSubServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceName = e.target.value;
    const subService = service.subServices.find(s => s.name === serviceName) || null;
    setSelectedSubService(subService);
  };

  const validateForm = () => {
    if (!selectedSubService || !fullName.trim() || !phone.trim() || !email.trim()) {
        setFormError('All fields are required.');
        return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        setFormError('Please enter a valid email address.');
        return false;
    }
    if (!/^[0-9\+]{10,13}$/.test(phone)) {
        setFormError('Please enter a valid phone number.');
        return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setStep('processing');
    setTimeout(() => {
      const voucher = `SS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      setGeneratedVoucher(voucher);
      setStep('success');
    }, 2000);
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">Service / Voucher</label>
          <select id="service-type" name="service-type" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" value={selectedSubService?.name || ''} onChange={handleSubServiceChange}>
            {service.subServices.map(sub => (
              <option key={sub.name} value={sub.name}>{sub.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" name="full-name" id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" placeholder="John Doe" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" name="phone" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" placeholder="024 XXX XXXX" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" placeholder="you@example.com" />
        </div>
      </div>
       {formError && <p className="mt-4 text-sm text-red-600">{formError}</p>}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center text-lg font-bold">
          <span className="text-gray-600">Total Price:</span>
          <span className="text-indigo-600">GHS {selectedSubService?.price.toFixed(2)}</span>
        </div>
        <button type="submit" className="mt-6 w-full bg-indigo-600 border border-transparent rounded-md py-2 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Proceed to Pay
        </button>
      </div>
    </form>
  );

  const renderProcessing = () => (
    <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <h3 className="mt-6 text-xl font-semibold text-gray-800">Processing Payment</h3>
        <p className="mt-2 text-gray-600">Please wait, we are securely processing your transaction.</p>
    </div>
  );

 const renderSuccess = () => (
    <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Payment Successful!</h3>
        <p className="mt-2 text-gray-600">Your voucher has been generated successfully.</p>
        <div className="mt-8 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
            <p className="text-sm text-gray-700">Service: <span className="font-semibold">{selectedSubService?.name}</span></p>
            <p className="mt-2 text-sm text-gray-700">Voucher Code:</p>
            <p className="text-2xl font-bold text-indigo-700 tracking-wider mt-1">{generatedVoucher}</p>
        </div>
        <p className="mt-6 text-xs text-gray-500">A copy of your voucher has been sent to {email} and {phone}.</p>
        <button onClick={onClose} className="mt-8 w-full bg-indigo-600 border border-transparent rounded-md py-2 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Make Another Purchase
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all">
        <div className="absolute top-0 right-0 pt-4 pr-4">
          <button type="button" className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onClick={onClose}>
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">
            <div className="flex items-start space-x-4 mb-6">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 flex-shrink-0">
                    <service.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">{service.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">Complete the form below to proceed.</p>
                </div>
            </div>
            
            {step === 'form' && renderForm()}
            {step === 'processing' && renderProcessing()}
            {step === 'success' && renderSuccess()}
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;