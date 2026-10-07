import { useState } from 'react';
import {
  PawPrint, ArrowLeft, CheckCircle, Mail, Clock, AlertTriangle,
  Camera, ChevronRight, ChevronLeft, User, MapPin, Phone
} from 'lucide-react';
import { BreedSelect } from './BreedSelect';
import { generatePreRegId, MOCK_USERS, type Pet } from '../types';

interface PreRegistrationProps {
  currentUserId: string;
  onBack: () => void;
}

type Step = 'pet-details' | 'owner-confirm' | 'review' | 'submitted';

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Others'];

export function PreRegistration({ currentUserId, onBack }: PreRegistrationProps) {
  const currentUser = MOCK_USERS.find(u => u.id === currentUserId)!;
  const [step, setStep] = useState<Step>('pet-details');
  const [preRegId] = useState(generatePreRegId());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [petForm, setPetForm] = useState({
    name: '',
    species: '',
    breed: '',
    color: '',
    sex: '' as 'Male' | 'Female' | '',
    age: '',
    weight: '',
    markings: '',
  });

  const [ownerForm, setOwnerForm] = useState({
    ownerName: currentUser.name,
    ownerAddress: '',
    ownerContact: '',
    barangay: currentUser.barangay || '',
  });

  const setPet = (key: string, value: string) => {
    setPetForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const setOwner = (key: string, value: string) => {
    setOwnerForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const barangays = [
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
    'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
  ];

  const validatePetDetails = () => {
    const e: Record<string, string> = {};
    if (!petForm.name.trim()) e.name = 'Pet name is required';
    if (!petForm.species) e.species = 'Species is required';
    if (!petForm.breed.trim()) e.breed = 'Breed is required';
    if (!petForm.color.trim()) e.color = 'Color is required';
    if (!petForm.sex) e.sex = 'Sex is required';
    if (!petForm.age.trim()) e.age = 'Age is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateOwner = () => {
    const e: Record<string, string> = {};
    if (!ownerForm.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!ownerForm.ownerAddress.trim()) e.ownerAddress = 'Address is required';
    if (!ownerForm.ownerContact.match(/^09\d{9}$/)) e.ownerContact = 'Valid PH mobile required (09XXXXXXXXX)';
    if (!ownerForm.barangay) e.barangay = 'Please select barangay';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (step === 'pet-details' && validatePetDetails()) setStep('owner-confirm');
    else if (step === 'owner-confirm' && validateOwner()) setStep('review');
  };

  const handleSubmit = () => {
    // In a real app: POST to API, send confirmation email
    setStep('submitted');
  };

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  const expiryStr = expiryDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a2444] to-[#1a4a8a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#60A85C] to-[#4a8a47] p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Pre-Registration Submitted!</h2>
            <p className="text-green-100 text-sm">A confirmation email has been sent to {currentUser.email}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Pre-Reg ID */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700 mb-1">Your Pre-Registration ID</p>
              <p className="text-2xl font-mono font-bold text-blue-900">{preRegId}</p>
              <p className="text-xs text-blue-600 mt-1">Keep this ID for your records</p>
            </div>

            {/* Pet Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <PawPrint className="w-4 h-4 text-[#2B5EA6]" />
                <p className="font-semibold text-gray-800">{petForm.name} ({petForm.species})</p>
              </div>
              <p className="text-sm text-gray-600">Breed: {petForm.breed} • {petForm.sex} • {petForm.age}</p>
              <p className="text-sm text-gray-600">Owner: {ownerForm.ownerName} • {ownerForm.barangay}</p>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 mb-2" style={{display:"flex",alignItems:"center",gap:6}}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Important Notice</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Your pre-registration must be validated by the City Veterinary Office (CVO).</li>
                    <li>• <strong>Bring your pet to the CVO within 14 days</strong> for in-person validation.</li>
                    <li>• This pre-registration will <strong>expire on {expiryStr}</strong>.</li>
                    <li>• Upon validation, your pet will receive an official Pet Tag ID.</li>
                    <li>• Expired pre-registrations must be resubmitted.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <Mail className="w-4 h-4 text-[#2B5EA6]" />
              <span>Confirmation email sent to <strong>{currentUser.email}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Expires: <strong>{expiryStr}</strong></span>
            </div>

            <button
              onClick={onBack}
              className="w-full py-3 bg-[#2B5EA6] text-white rounded-xl font-semibold hover:bg-[#234a85] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles: Record<string, string> = {
    'pet-details': 'Pet Information',
    'owner-confirm': 'Owner Details',
    'review': 'Review & Submit',
  };

  const stepNums: Record<string, number> = {
    'pet-details': 1,
    'owner-confirm': 2,
    'review': 3,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2444] to-[#1a4a8a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2B5EA6] to-[#1a4a8a] p-6 text-white">
          <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white mb-4 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-4">
            <PawPrint className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">Pet Pre-Registration</h1>
              <p className="text-blue-200 text-xs">Calaca City Veterinary Office</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {['pet-details', 'owner-confirm', 'review'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  stepNums[step] > i + 1 ? 'bg-[#60A85C] text-white' :
                  step === s ? 'bg-white text-[#2B5EA6]' :
                  'bg-white/20 text-white'
                }`}>
                  {stepNums[step] > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <div className={`text-xs ${step === s ? 'text-white font-semibold' : 'text-blue-300'}`}>
                  {stepTitles[s]}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-white/20" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* STEP 1: Pet Details */}
          {step === 'pet-details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Pet Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={petForm.name}
                    onChange={e => setPet('name', e.target.value)}
                    placeholder="e.g. Bantay"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Species <span className="text-red-500">*</span></label>
                  <select
                    value={petForm.species}
                    onChange={e => setPet('species', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.species ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.species && <p className="text-red-500 text-xs mt-1">{errors.species}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Breed <span className="text-red-500">*</span></label>
                  <BreedSelect species={petForm.species} value={petForm.breed} onChange={v => setPet('breed', v)} className={`px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.breed ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Color / Markings <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={petForm.color}
                    onChange={e => setPet('color', e.target.value)}
                    placeholder="e.g. Brown and White"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.color ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sex <span className="text-red-500">*</span></label>
                  <select
                    value={petForm.sex}
                    onChange={e => setPet('sex', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.sex ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Age <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={petForm.age}
                    onChange={e => setPet('age', e.target.value)}
                    placeholder="e.g. 2 years"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.age ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Weight (optional)</label>
                  <input
                    type="text"
                    value={petForm.weight}
                    onChange={e => setPet('weight', e.target.value)}
                    placeholder="e.g. 5 kg"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Distinguishing Marks (optional)</label>
                  <textarea
                    value={petForm.markings}
                    onChange={e => setPet('markings', e.target.value)}
                    placeholder="Any distinctive features, scars, or markings..."
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Owner Confirm */}
          {step === 'owner-confirm' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  Pre-filled from your account. Update if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Owner Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={ownerForm.ownerName}
                  onChange={e => setOwner('ownerName', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.ownerName ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Barangay <span className="text-red-500">*</span></label>
                <select
                  value={ownerForm.barangay}
                  onChange={e => setOwner('barangay', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.barangay ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.barangay && <p className="text-red-500 text-xs mt-1">{errors.barangay}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Full Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={ownerForm.ownerAddress}
                  onChange={e => setOwner('ownerAddress', e.target.value)}
                  placeholder="House No., Street, Barangay, Calaca City"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.ownerAddress ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.ownerAddress && <p className="text-red-500 text-xs mt-1">{errors.ownerAddress}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Contact Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={ownerForm.ownerContact}
                  onChange={e => setOwner('ownerContact', e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.ownerContact ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.ownerContact && <p className="text-red-500 text-xs mt-1">{errors.ownerContact}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">Review Your Pre-Registration</h3>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pet Information</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name:</span><span className="text-gray-800 font-medium">{petForm.name}</span>
                  <span className="text-gray-500">Species:</span><span className="text-gray-800 font-medium">{petForm.species}</span>
                  <span className="text-gray-500">Breed:</span><span className="text-gray-800 font-medium">{petForm.breed}</span>
                  <span className="text-gray-500">Color:</span><span className="text-gray-800 font-medium">{petForm.color}</span>
                  <span className="text-gray-500">Sex:</span><span className="text-gray-800 font-medium">{petForm.sex}</span>
                  <span className="text-gray-500">Age:</span><span className="text-gray-800 font-medium">{petForm.age}</span>
                  {petForm.weight && <><span className="text-gray-500">Weight:</span><span className="text-gray-800 font-medium">{petForm.weight}</span></>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Owner Information</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name:</span><span className="text-gray-800 font-medium">{ownerForm.ownerName}</span>
                  <span className="text-gray-500">Barangay:</span><span className="text-gray-800 font-medium">{ownerForm.barangay}</span>
                  <span className="text-gray-500">Address:</span><span className="text-gray-800 font-medium">{ownerForm.ownerAddress}</span>
                  <span className="text-gray-500">Contact:</span><span className="text-gray-800 font-medium">{ownerForm.ownerContact}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    After submitting, you must bring your pet to the CVO for validation within <strong>14 days</strong> (by {expiryStr}). Your pet will be assigned an official tag ID after validation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          {step !== 'pet-details' && (
            <button
              onClick={() => {
                if (step === 'owner-confirm') setStep('pet-details');
                else if (step === 'review') setStep('owner-confirm');
              }}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={step === 'review' ? handleSubmit : handleNextStep}
            className="flex-1 py-3 bg-[#2B5EA6] text-white rounded-xl font-semibold hover:bg-[#234a85] transition-colors flex items-center justify-center gap-2"
          >
            {step === 'review' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Pre-Registration
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
