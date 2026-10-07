import { useState, useRef } from 'react';
import {
  Search, PawPrint, User, UserX, Tag, CheckCircle, Camera,
  AlertTriangle, ChevronRight, Plus, X, UserCheck, Hash
} from 'lucide-react';
import { BreedSelect } from './BreedSelect';
import { MOCK_USERS, MOCK_PETS, generateTempId, type Pet, type User as UserType } from '../types';

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Others'];

interface DirectRegistrationProps {
  adminUserId: string;
}

type OwnerMode = 'searching' | 'registered' | 'unregistered' | null;
type Step = 'form' | 'photo' | 'confirm' | 'done';

export function DirectRegistration({ adminUserId }: DirectRegistrationProps) {
  const [step, setStep] = useState<Step>('form');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerMode, setOwnerMode] = useState<OwnerMode>(null);
  const [selectedOwner, setSelectedOwner] = useState<UserType | null>(null);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [generatedTempId] = useState(generateTempId());
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [petTagInput, setPetTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedPetId, setSavedPetId] = useState('');

  const admin = MOCK_USERS.find(u => u.id === adminUserId)!;

  const [petForm, setPetForm] = useState({
    name: '',
    species: '',
    breed: '',
    color: '',
    sex: '' as 'Male' | 'Female' | '',
    age: '',
    weight: '',
    markings: '',
    petTagId: '',
  });

  const [unregisteredOwner, setUnregisteredOwner] = useState({
    name: '',
    contact: '',
    address: '',
    barangay: '',
  });

  const barangays = [
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
    'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10',
  ];

  // Filter registered users (public, bahw) for search
  const filteredUsers = MOCK_USERS.filter(u =>
    ['public', 'bahw'].includes(u.role) &&
    ownerSearch.length >= 2 &&
    (
      u.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(ownerSearch.toLowerCase())
    )
  );

  const setPet = (key: string, value: string) => {
    setPetForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!petForm.name.trim()) e.name = 'Pet name is required';
    if (!petForm.species) e.species = 'Species is required';
    if (!petForm.breed.trim()) e.breed = 'Breed is required';
    if (!petForm.color.trim()) e.color = 'Color is required';
    if (!petForm.sex) e.sex = 'Sex is required';
    if (!petForm.age.trim()) e.age = 'Age is required';
    if (!petForm.petTagId.trim()) e.petTagId = 'Pet Tag ID is required';
    if (petForm.petTagId && !petForm.petTagId.match(/^TAG-\d{4}-\d{4}$/)) e.petTagId = 'Format: TAG-YYYY-XXXX';

    if (ownerMode === null) e.owner = 'Please select or set an owner';
    if (ownerMode === 'unregistered') {
      if (!unregisteredOwner.name.trim()) e.ownerName = 'Owner name is required';
      if (!unregisteredOwner.contact.match(/^09\d{9}$/)) e.ownerContact = 'Valid PH mobile required';
      if (!unregisteredOwner.address.trim()) e.ownerAddress = 'Address is required';
      if (!unregisteredOwner.barangay) e.ownerBarangay = 'Barangay is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceedToPhoto = () => {
    if (validateForm()) setStep('photo');
  };

  const handleProceedToConfirm = () => {
    if (photoCaptured) setStep('confirm');
  };

  const handleSave = () => {
    const id = `PET-${Date.now().toString(36).toUpperCase()}`;
    setSavedPetId(id);
    setStep('done');
  };

  const handleSelectOwner = (user: UserType) => {
    setSelectedOwner(user);
    setOwnerMode('registered');
    setOwnerSearch(user.name);
    setShowOwnerDropdown(false);
    if (errors.owner) setErrors(e => ({ ...e, owner: '' }));
  };

  const handleSetUnregistered = () => {
    setOwnerMode('unregistered');
    setSelectedOwner(null);
    setShowOwnerDropdown(false);
    if (errors.owner) setErrors(e => ({ ...e, owner: '' }));
  };

  const handleClearOwner = () => {
    setOwnerMode(null);
    setSelectedOwner(null);
    setOwnerSearch('');
    setShowOwnerDropdown(false);
  };

  if (step === 'done') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">Pet Registered Successfully!</h3>
          <p className="text-gray-600 mb-6">{petForm.name} has been added to the official registry.</p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pet Record ID:</span>
              <span className="font-mono font-bold text-[#2B5EA6]">{savedPetId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pet Tag ID:</span>
              <span className="font-mono font-bold text-green-700">{petForm.petTagId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Owner:</span>
              <span className="font-medium">
                {ownerMode === 'registered' ? selectedOwner?.name : unregisteredOwner.name}
              </span>
            </div>
            {ownerMode === 'unregistered' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Temporary Owner ID:</span>
                <span className="font-mono font-bold text-amber-700">{generatedTempId}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Registered by:</span>
              <span className="font-medium">{admin.name}</span>
            </div>
          </div>

          {ownerMode === 'unregistered' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4 text-left">
              <p className="font-semibold mb-2 flex items-center gap-1">
                <Tag className="w-4 h-4" /> Temporary ID Issued
              </p>
              <p>
                Since the owner has no registered account, a Temporary ID{' '}
                <strong className="font-mono">{generatedTempId}</strong> has been issued.
                Give this to the owner. When they create an account and enter this ID,
                their pets will automatically be tagged to them.
              </p>
            </div>
          )}

          {ownerMode === 'registered' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-4 text-left">
              ✓ Pet has been automatically tagged to <strong>{selectedOwner?.name}</strong>'s account.
            </div>
          )}

          <button
            onClick={() => {
              setStep('form');
              setPetForm({ name: '', species: '', breed: '', color: '', sex: '', age: '', weight: '', markings: '', petTagId: '' });
              setOwnerMode(null);
              setSelectedOwner(null);
              setOwnerSearch('');
              setPhotoCaptured(false);
              setErrors({});
            }}
            className="w-full py-3 bg-[#2B5EA6] text-white rounded-xl font-semibold hover:bg-[#234a85] transition-colors"
          >
            Register Another Pet
          </button>
        </div>
      </div>
    );
  }

  if (step === 'photo') {
    return (
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
          <Camera className="w-5 h-5 text-[#2B5EA6]" />
          Capture Pet Photo
        </h3>

        <div
          onClick={() => setPhotoCaptured(true)}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
            photoCaptured
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-[#2B5EA6] hover:bg-blue-50'
          }`}
        >
          {photoCaptured ? (
            <div className="space-y-2">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <p className="text-green-700 font-bold text-lg">Photo Captured!</p>
              <p className="text-xs text-green-600">Click to retake</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Camera className="w-16 h-16 text-gray-300 mx-auto" />
              <p className="text-gray-700 font-semibold">Click to Take Photo</p>
              <p className="text-sm text-gray-500">Take a clear photo of the pet for the official record</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
            className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleProceedToConfirm}
            disabled={!photoCaptured}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              photoCaptured
                ? 'bg-[#2B5EA6] text-white hover:bg-[#234a85]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Proceed to Confirm
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="bg-white rounded-xl shadow p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 text-lg">Confirm & Save Registration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Pet Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-500">Name:</span> <strong>{petForm.name}</strong></p>
              <p><span className="text-gray-500">Species:</span> {petForm.species}</p>
              <p><span className="text-gray-500">Breed:</span> {petForm.breed}</p>
              <p><span className="text-gray-500">Color:</span> {petForm.color}</p>
              <p><span className="text-gray-500">Sex:</span> {petForm.sex}</p>
              <p><span className="text-gray-500">Age:</span> {petForm.age}</p>
              <p><span className="text-gray-500">Tag ID:</span> <span className="font-mono font-bold text-[#2B5EA6]">{petForm.petTagId}</span></p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Owner</p>
            {ownerMode === 'registered' && selectedOwner ? (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-semibold text-xs">Registered User</span>
                </div>
                <p><strong>{selectedOwner.name}</strong></p>
                <p className="text-gray-500">{selectedOwner.email}</p>
                <p className="text-gray-500">{selectedOwner.barangay}</p>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserX className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 font-semibold text-xs">Unregistered — TempID Issued</span>
                </div>
                <p><strong>{unregisteredOwner.name}</strong></p>
                <p className="text-gray-500">{unregisteredOwner.contact}</p>
                <p className="text-gray-500">{unregisteredOwner.address}</p>
                <p className="font-mono text-amber-700 font-bold">{generatedTempId}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
          Photo captured ✓ • Registered by: {admin.name}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('photo')}
            className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-[#60A85C] text-white rounded-xl font-semibold hover:bg-[#4a8a47] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm & Save to Registry
          </button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-800 font-bold text-xl mb-1">Direct Pet Registration</h2>
        <p className="text-gray-600 text-sm">Register a pet directly (for walk-in clients at the CVO)</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-5">
        {/* Pet Details */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-[#2B5EA6]" />
            Pet Information
          </h3>
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
              <label className="block text-sm text-gray-600 mb-1">Color <span className="text-red-500">*</span></label>
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
              <label className="block text-sm text-gray-600 mb-1">
                Pet Tag ID <span className="text-red-500">*</span>
                <span className="text-gray-400 ml-1 font-normal">(Format: TAG-YYYY-XXXX)</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={petForm.petTagId}
                  onChange={e => setPet('petTagId', e.target.value.toUpperCase())}
                  placeholder="TAG-2025-0005"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.petTagId ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>
              {errors.petTagId && <p className="text-red-500 text-xs mt-1">{errors.petTagId}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Distinguishing Marks (optional)</label>
              <textarea
                value={petForm.markings}
                onChange={e => setPet('markings', e.target.value)}
                placeholder="Any distinctive features..."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Owner Search */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#2B5EA6]" />
            Owner Assignment <span className="text-red-500">*</span>
          </h3>

          {ownerMode === null || ownerMode === 'searching' ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={ownerSearch}
                  onChange={e => {
                    setOwnerSearch(e.target.value);
                    setOwnerMode('searching');
                    setShowOwnerDropdown(true);
                    if (errors.owner) setErrors(er => ({ ...er, owner: '' }));
                  }}
                  onFocus={() => { if (ownerSearch.length >= 2) setShowOwnerDropdown(true); }}
                  placeholder="Type owner's name to search registered users..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] ${errors.owner ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>

              {/* Dropdown */}
              {showOwnerDropdown && ownerSearch.length >= 2 && (
                <div className="border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectOwner(user)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
                    >
                      <div className="w-8 h-8 bg-[#2B5EA6] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email} • {user.barangay}</p>
                      </div>
                      <UserCheck className="w-4 h-4 text-green-500 ml-auto" />
                    </button>
                  ))}

                  {/* Unregistered option */}
                  <button
                    type="button"
                    onClick={handleSetUnregistered}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 flex items-center gap-3 bg-amber-50/50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-800">Register as Unregistered Owner</p>
                      <p className="text-xs text-amber-600">A Temporary ID will be issued — owner can claim later</p>
                    </div>
                  </button>

                  {filteredUsers.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No registered users found for "{ownerSearch}"
                    </div>
                  )}
                </div>
              )}
              {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner}</p>}
            </div>
          ) : null}

          {/* Registered Owner Badge */}
          {ownerMode === 'registered' && selectedOwner && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  {selectedOwner.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <p className="font-semibold text-green-800">{selectedOwner.name}</p>
                  </div>
                  <p className="text-xs text-green-600">{selectedOwner.email} • {selectedOwner.barangay}</p>
                  <p className="text-xs text-green-700 mt-0.5">Pet will be auto-tagged to this account</p>
                </div>
              </div>
              <button onClick={handleClearOwner} className="p-1.5 hover:bg-green-100 rounded-lg text-green-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Unregistered Owner Form */}
          {ownerMode === 'unregistered' && (
            <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-amber-800">Unregistered Owner Details</p>
                </div>
                <button onClick={handleClearOwner} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-amber-100 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
                <Hash className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Temporary ID will be issued: <span className="font-mono">{generatedTempId}</span></p>
                  <p className="text-xs mt-0.5">Give this to the owner. They can enter it during account creation to claim their pets. It can only be used once.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Owner Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={unregisteredOwner.name}
                    onChange={e => setUnregisteredOwner(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.ownerName ? 'border-red-400' : 'border-amber-300'}`}
                  />
                  {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={unregisteredOwner.contact}
                    onChange={e => setUnregisteredOwner(f => ({ ...f, contact: e.target.value }))}
                    placeholder="09XXXXXXXXX"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.ownerContact ? 'border-red-400' : 'border-amber-300'}`}
                  />
                  {errors.ownerContact && <p className="text-red-500 text-xs mt-1">{errors.ownerContact}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Barangay <span className="text-red-500">*</span></label>
                  <select
                    value={unregisteredOwner.barangay}
                    onChange={e => setUnregisteredOwner(f => ({ ...f, barangay: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.ownerBarangay ? 'border-red-400' : 'border-amber-300'}`}
                  >
                    <option value="">Select</option>
                    {barangays.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {errors.ownerBarangay && <p className="text-red-500 text-xs mt-1">{errors.ownerBarangay}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={unregisteredOwner.address}
                    onChange={e => setUnregisteredOwner(f => ({ ...f, address: e.target.value }))}
                    placeholder="Full address"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 ${errors.ownerAddress ? 'border-red-400' : 'border-amber-300'}`}
                  />
                  {errors.ownerAddress && <p className="text-red-500 text-xs mt-1">{errors.ownerAddress}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleProceedToPhoto}
          className="w-full py-3 bg-[#2B5EA6] text-white rounded-xl font-semibold hover:bg-[#234a85] transition-colors flex items-center justify-center gap-2"
        >
          Proceed to Photo Capture
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
