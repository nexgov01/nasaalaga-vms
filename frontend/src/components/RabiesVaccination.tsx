import { useState } from 'react';
import { BreedSelect } from './BreedSelect';
import { Plus, Search, Syringe, Download, Calendar, PawPrint, AlertCircle, MapPin, Heart, X, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';

interface Pet {
  id: string;
  petName: string;
  species: string;
  breed: string;
  age: string;
  color: string;
  ownerName: string;
  ownerContact: string;
  ownerAddress: string;
  barangay: string;
  microchipId?: string;
  registrationDate: string;
  vaccinationStatus: 'Vaccinated' | 'Not Vaccinated' | 'Due Soon';
  lastVaccinationDate?: string;
  nextVaccinationDate?: string;
  status: 'Active' | 'Lost' | 'Found';
}

interface LostFoundReport {
  id: string;
  petId: string;
  petName: string;
  species: string;
  breed: string;
  color: string;
  type: 'Lost' | 'Found';
  reportedBy: string;
  contactNumber: string;
  lastSeenLocation: string;
  barangay: string;
  dateReported: string;
  description: string;
  status: 'Open' | 'Resolved';
}

interface BarangaySchedule {
  id: string;
  barangay: string;
  date: string;
  time: string;
  location: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  registeredPets: number;
  capacity: number;
}

export function RabiesVaccination() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPetDialog, setShowNewPetDialog] = useState(false);
  const [showVaccinationDialog, setShowVaccinationDialog] = useState(false);
  const [showLostFoundDialog, setShowLostFoundDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pets' | 'lost-found' | 'schedule'>('overview');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'vaccinated' | 'not-vaccinated' | 'due-soon'>('all');
  
  const [newPet, setNewPet] = useState({
    petName: '',
    species: '',
    breed: '',
    age: '',
    color: '',
    ownerName: '',
    ownerContact: '',
    ownerAddress: '',
    barangay: '',
    microchipId: ''
  });

  const [lostFoundReport, setLostFoundReport] = useState({
    petId: '',
    type: 'Lost' as 'Lost' | 'Found',
    reportedBy: '',
    contactNumber: '',
    lastSeenLocation: '',
    barangay: '',
    description: ''
  });

  const [barangaySchedule, setBarangaySchedule] = useState({
    barangay: '',
    date: '',
    time: '',
    location: '',
    capacity: ''
  });

  const [pets, setPets] = useState<Pet[]>([
    {
      id: 'BLU-000-00001',
      petName: 'Brownie',
      species: 'Dog',
      breed: 'Aspin',
      age: '3 years',
      color: 'Brown',
      ownerName: 'Juan Dela Cruz',
      ownerContact: '0917-123-4567',
      ownerAddress: 'Phase 1, Block 2',
      barangay: 'Barangay 1',
      microchipId: 'MC123456',
      registrationDate: 'Jan 5, 2025',
      vaccinationStatus: 'Vaccinated',
      lastVaccinationDate: 'Dec 10, 2024',
      nextVaccinationDate: 'Dec 10, 2025',
      status: 'Active'
    },
    {
      id: 'BLU-000-00002',
      petName: 'Whiskers',
      species: 'Cat',
      breed: 'Persian',
      age: '2 years',
      color: 'White',
      ownerName: 'Maria Santos',
      ownerContact: '0918-234-5678',
      ownerAddress: 'Purok 3',
      barangay: 'Barangay 3',
      registrationDate: 'Dec 28, 2024',
      vaccinationStatus: 'Vaccinated',
      lastVaccinationDate: 'Dec 8, 2024',
      nextVaccinationDate: 'Dec 8, 2025',
      status: 'Active'
    },
    {
      id: 'BLU-000-00003',
      petName: 'Rocky',
      species: 'Dog',
      breed: 'German Shepherd',
      age: '4 years',
      color: 'Black/Tan',
      ownerName: 'Pedro Reyes',
      ownerContact: '0919-345-6789',
      ownerAddress: 'Sitio Bayanan',
      barangay: 'Barangay 2',
      microchipId: 'MC789012',
      registrationDate: 'Nov 15, 2024',
      vaccinationStatus: 'Due Soon',
      lastVaccinationDate: 'Nov 20, 2024',
      nextVaccinationDate: 'Feb 20, 2025',
      status: 'Active'
    },
    {
      id: 'BLU-000-00004',
      petName: 'Max',
      species: 'Dog',
      breed: 'Labrador',
      age: '5 years',
      color: 'Golden',
      ownerName: 'Ana Garcia',
      ownerContact: '0920-456-7890',
      ownerAddress: 'Zone 4',
      barangay: 'Barangay 5',
      registrationDate: 'Oct 10, 2024',
      vaccinationStatus: 'Not Vaccinated',
      status: 'Active'
    },
    {
      id: 'BLU-000-00005',
      petName: 'Lucky',
      species: 'Dog',
      breed: 'Shih Tzu',
      age: '1 year',
      color: 'Gray',
      ownerName: 'Carlos Lopez',
      ownerContact: '0921-567-8901',
      ownerAddress: 'Purok 5',
      barangay: 'Barangay 4',
      registrationDate: 'Jan 8, 2025',
      vaccinationStatus: 'Not Vaccinated',
      status: 'Lost'
    }
  ]);

  const [lostFoundReports, setLostFoundReports] = useState<LostFoundReport[]>([
    {
      id: 'LF-001',
      petId: 'BLU-000-00005',
      petName: 'Lucky',
      species: 'Dog',
      breed: 'Shih Tzu',
      color: 'Gray',
      type: 'Lost',
      reportedBy: 'Carlos Lopez',
      contactNumber: '0921-567-8901',
      lastSeenLocation: 'Near Public Market',
      barangay: 'Barangay 4',
      dateReported: 'Jan 12, 2025',
      description: 'Small gray Shih Tzu, wearing red collar with name tag',
      status: 'Open'
    },
    {
      id: 'LF-002',
      petId: 'UNKNOWN',
      petName: 'Unknown',
      species: 'Cat',
      breed: 'Siamese',
      color: 'Cream/Brown points',
      type: 'Found',
      reportedBy: 'Rosa Mendoza',
      contactNumber: '0922-678-9012',
      lastSeenLocation: 'Barangay Hall premises',
      barangay: 'Barangay 2',
      dateReported: 'Jan 10, 2025',
      description: 'Friendly Siamese cat, no collar, appears well-fed',
      status: 'Open'
    }
  ]);

  const [barangaySchedules, setBarangaySchedules] = useState<BarangaySchedule[]>([
    {
      id: 'SCH-001',
      barangay: 'Barangay 1',
      date: 'Jan 20, 2025',
      time: '8:00 AM - 12:00 PM',
      location: 'Barangay 1 Covered Court',
      status: 'Upcoming',
      registeredPets: 45,
      capacity: 100
    },
    {
      id: 'SCH-002',
      barangay: 'Barangay 3',
      date: 'Jan 22, 2025',
      time: '1:00 PM - 5:00 PM',
      location: 'Barangay 3 Multi-Purpose Hall',
      status: 'Upcoming',
      registeredPets: 67,
      capacity: 100
    },
    {
      id: 'SCH-003',
      barangay: 'Barangay 5',
      date: 'Jan 18, 2025',
      time: '9:00 AM - 1:00 PM',
      location: 'Barangay 5 Health Center',
      status: 'Upcoming',
      registeredPets: 89,
      capacity: 100
    }
  ]);

  const handleAddPet = () => {
    const petId = `PET-${String(pets.length + 1).padStart(3, '0')}`;
    const pet: Pet = {
      id: petId,
      petName: newPet.petName,
      species: newPet.species,
      breed: newPet.breed,
      age: newPet.age,
      color: newPet.color,
      ownerName: newPet.ownerName,
      ownerContact: newPet.ownerContact,
      ownerAddress: newPet.ownerAddress,
      barangay: newPet.barangay,
      microchipId: newPet.microchipId || undefined,
      registrationDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      vaccinationStatus: 'Not Vaccinated',
      status: 'Active'
    };
    setPets([...pets, pet]);
    setShowNewPetDialog(false);
    setNewPet({
      petName: '',
      species: '',
      breed: '',
      age: '',
      color: '',
      ownerName: '',
      ownerContact: '',
      ownerAddress: '',
      barangay: '',
      microchipId: ''
    });
  };

  const handleVaccinatePet = (pet: Pet) => {
    const updatedPets = pets.map(p => {
      if (p.id === pet.id) {
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return {
          ...p,
          vaccinationStatus: 'Vaccinated' as const,
          lastVaccinationDate: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          nextVaccinationDate: nextYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }
      return p;
    });
    setPets(updatedPets);
    setShowVaccinationDialog(false);
    setSelectedPet(null);
  };

  const handleAddLostFoundReport = () => {
    const reportId = `LF-${String(lostFoundReports.length + 1).padStart(3, '0')}`;
    const pet = pets.find(p => p.id === lostFoundReport.petId);
    
    const report: LostFoundReport = {
      id: reportId,
      petId: lostFoundReport.petId,
      petName: pet?.petName || 'Unknown',
      species: pet?.species || 'Unknown',
      breed: pet?.breed || 'Unknown',
      color: pet?.color || 'Unknown',
      type: lostFoundReport.type,
      reportedBy: lostFoundReport.reportedBy,
      contactNumber: lostFoundReport.contactNumber,
      lastSeenLocation: lostFoundReport.lastSeenLocation,
      barangay: lostFoundReport.barangay,
      dateReported: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: lostFoundReport.description,
      status: 'Open'
    };

    setLostFoundReports([...lostFoundReports, report]);
    
    if (lostFoundReport.type === 'Lost' && pet) {
      const updatedPets = pets.map(p => 
        p.id === lostFoundReport.petId ? { ...p, status: 'Lost' as const } : p
      );
      setPets(updatedPets);
    }

    setShowLostFoundDialog(false);
    setLostFoundReport({
      petId: '',
      type: 'Lost',
      reportedBy: '',
      contactNumber: '',
      lastSeenLocation: '',
      barangay: '',
      description: ''
    });
  };

  const handleAddSchedule = () => {
    const scheduleId = `SCH-${String(barangaySchedules.length + 1).padStart(3, '0')}`;
    const schedule: BarangaySchedule = {
      id: scheduleId,
      barangay: barangaySchedule.barangay,
      date: new Date(barangaySchedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: barangaySchedule.time,
      location: barangaySchedule.location,
      status: 'Upcoming',
      registeredPets: 0,
      capacity: parseInt(barangaySchedule.capacity)
    };
    
    setBarangaySchedules([...barangaySchedules, schedule]);
    setShowScheduleDialog(false);
    setBarangaySchedule({
      barangay: '',
      date: '',
      time: '',
      location: '',
      capacity: ''
    });
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'vaccinated' && pet.vaccinationStatus === 'Vaccinated') ||
                         (filterStatus === 'not-vaccinated' && pet.vaccinationStatus === 'Not Vaccinated') ||
                         (filterStatus === 'due-soon' && pet.vaccinationStatus === 'Due Soon');
    
    return matchesSearch && matchesFilter;
  });

  const barangays = [
    'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5',
    'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10'
  ];

  // Statistics
  const totalRegistered = pets.length;
  const totalVaccinated = pets.filter(p => p.vaccinationStatus === 'Vaccinated').length;
  const vaccinationRate = ((totalVaccinated / totalRegistered) * 100).toFixed(1);
  const dueSoon = pets.filter(p => p.vaccinationStatus === 'Due Soon').length;
  const notVaccinated = pets.filter(p => p.vaccinationStatus === 'Not Vaccinated').length;
  const activeLostReports = lostFoundReports.filter(r => r.type === 'Lost' && r.status === 'Open').length;
  const activeFoundReports = lostFoundReports.filter(r => r.type === 'Found' && r.status === 'Open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-800 mb-1">Pet Registration & Rabies Program</h2>
          <p className="text-gray-600">Register pets, track vaccinations, and manage lost & found reports</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowNewPetDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2B5EA6] text-white rounded-md hover:bg-[#234a85] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Pet
          </button>
          <button 
            onClick={() => setShowScheduleDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#60A85C] text-white rounded-md hover:bg-[#4a8a47] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Barangay Schedule
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-[#2B5EA6] text-[#2B5EA6]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Syringe className="w-4 h-4" />
            Vaccination Overview
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'pets'
                ? 'border-b-2 border-[#2B5EA6] text-[#2B5EA6]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <PawPrint className="w-4 h-4" />
            Pet Records ({totalRegistered})
          </button>
          <button
            onClick={() => setActiveTab('lost-found')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'lost-found'
                ? 'border-b-2 border-[#2B5EA6] text-[#2B5EA6]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Lost & Found ({lostFoundReports.filter(r => r.status === 'Open').length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'schedule'
                ? 'border-b-2 border-[#2B5EA6] text-[#2B5EA6]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Vaccination Schedule
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Vaccinated</p>
                <p className="text-gray-900">{totalVaccinated}</p>
                <p className="text-xs text-green-600 mt-1">+12% this month</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <Syringe className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Coverage Rate</p>
                <p className="text-gray-900">{vaccinationRate}%</p>
                <p className="text-xs text-green-600 mt-1">Target: 95%</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Due This Month</p>
                <p className="text-gray-900">{dueSoon}</p>
                <p className="text-xs text-yellow-600 mt-1">Schedule reminders</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vaccine Stock</p>
                <p className="text-gray-900">850 doses</p>
                <p className="text-xs text-green-600 mt-1">Adequate supply</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Syringe className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pets Tab */}
      {activeTab === 'pets' && (
        <div>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by owner, pet name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#60A85C] text-white rounded-md hover:bg-[#4a8a47] transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2B5EA6] text-[#2B5EA6] rounded-md hover:bg-blue-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Campaign
                </button>
              </div>
            </div>
          </div>

          {/* Pet Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-700">Record ID</th>
                    <th className="text-left py-3 px-4 text-gray-700">Pet Owner</th>
                    <th className="text-left py-3 px-4 text-gray-700">Pet Name</th>
                    <th className="text-left py-3 px-4 text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-gray-700">Barangay</th>
                    <th className="text-left py-3 px-4 text-gray-700">Vaccination Date</th>
                    <th className="text-left py-3 px-4 text-gray-700">Next Due</th>
                    <th className="text-left py-3 px-4 text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPets.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{record.id}</td>
                      <td className="py-3 px-4 text-gray-600">{record.ownerName}</td>
                      <td className="py-3 px-4 text-gray-600">{record.petName}</td>
                      <td className="py-3 px-4 text-gray-600">{record.species}</td>
                      <td className="py-3 px-4 text-gray-600">{record.barangay}</td>
                      <td className="py-3 px-4 text-gray-600">{record.lastVaccinationDate}</td>
                      <td className="py-3 px-4 text-gray-600">{record.nextVaccinationDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          record.vaccinationStatus === 'Vaccinated' 
                            ? 'bg-green-100 text-green-800' 
                            : record.vaccinationStatus === 'Due Soon'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {record.vaccinationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-[#2B5EA6] hover:underline text-sm">
                          View Certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Lost & Found Tab */}
      {activeTab === 'lost-found' && (
        <div>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by owner, pet name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#60A85C] text-white rounded-md hover:bg-[#4a8a47] transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2B5EA6] text-[#2B5EA6] rounded-md hover:bg-blue-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Campaign
                </button>
              </div>
            </div>
          </div>

          {/* Lost & Found Reports Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-700">Report ID</th>
                    <th className="text-left py-3 px-4 text-gray-700">Pet Name</th>
                    <th className="text-left py-3 px-4 text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-gray-700">Species</th>
                    <th className="text-left py-3 px-4 text-gray-700">Breed</th>
                    <th className="text-left py-3 px-4 text-gray-700">Color</th>
                    <th className="text-left py-3 px-4 text-gray-700">Barangay</th>
                    <th className="text-left py-3 px-4 text-gray-700">Date Reported</th>
                    <th className="text-left py-3 px-4 text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lostFoundReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{report.id}</td>
                      <td className="py-3 px-4 text-gray-600">{report.petName}</td>
                      <td className="py-3 px-4 text-gray-600">{report.type}</td>
                      <td className="py-3 px-4 text-gray-600">{report.species}</td>
                      <td className="py-3 px-4 text-gray-600">{report.breed}</td>
                      <td className="py-3 px-4 text-gray-600">{report.color}</td>
                      <td className="py-3 px-4 text-gray-600">{report.barangay}</td>
                      <td className="py-3 px-4 text-gray-600">{report.dateReported}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          report.status === 'Open' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-[#2B5EA6] hover:underline text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div>
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by barangay or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-[#60A85C] text-white rounded-md hover:bg-[#4a8a47] transition-colors">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#2B5EA6] text-[#2B5EA6] rounded-md hover:bg-blue-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Schedule Campaign
                </button>
              </div>
            </div>
          </div>

          {/* Barangay Schedules Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-700">Schedule ID</th>
                    <th className="text-left py-3 px-4 text-gray-700">Barangay</th>
                    <th className="text-left py-3 px-4 text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700">Registered Pets</th>
                    <th className="text-left py-3 px-4 text-gray-700">Capacity</th>
                    <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {barangaySchedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{schedule.id}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.barangay}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.date}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.time}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.location}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          schedule.status === 'Upcoming' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : schedule.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{schedule.registeredPets}</td>
                      <td className="py-3 px-4 text-gray-600">{schedule.capacity}</td>
                      <td className="py-3 px-4">
                        <button className="text-[#2B5EA6] hover:underline text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Pet Dialog */}
      {showNewPetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-gray-800 mb-4">Register New Pet</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-600">Pet Name</label>
                <input
                  type="text"
                  value={newPet.petName}
                  onChange={(e) => setNewPet({ ...newPet, petName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Species</label>
                <input
                  type="text"
                  value={newPet.species}
                  onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Breed</label>
                <BreedSelect species={newPet.species} value={newPet.breed} onChange={(v) => setNewPet(p => ({ ...p, breed: v }))} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent" />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Age</label>
                <input
                  type="text"
                  value={newPet.age}
                  onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Color</label>
                <input
                  type="text"
                  value={newPet.color}
                  onChange={(e) => setNewPet({ ...newPet, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Name</label>
                <input
                  type="text"
                  value={newPet.ownerName}
                  onChange={(e) => setNewPet({ ...newPet, ownerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Contact</label>
                <input
                  type="text"
                  value={newPet.ownerContact}
                  onChange={(e) => setNewPet({ ...newPet, ownerContact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Address</label>
                <input
                  type="text"
                  value={newPet.ownerAddress}
                  onChange={(e) => setNewPet({ ...newPet, ownerAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Barangay</label>
                <select
                  value={newPet.barangay}
                  onChange={(e) => setNewPet({ ...newPet, barangay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Microchip ID (Optional)</label>
                <input
                  type="text"
                  value={newPet.microchipId}
                  onChange={(e) => setNewPet({ ...newPet, microchipId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowNewPetDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPet}
                className="px-4 py-2 bg-[#2B5EA6] text-white rounded-md hover:bg-[#234a85] transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vaccination Dialog */}
      {showVaccinationDialog && selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-gray-800 mb-4">Vaccinate Pet</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-600">Pet Name</label>
                <input
                  type="text"
                  value={selectedPet.petName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Species</label>
                <input
                  type="text"
                  value={selectedPet.species}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Breed</label>
                <input
                  type="text"
                  value={selectedPet.breed}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Age</label>
                <input
                  type="text"
                  value={selectedPet.age}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Color</label>
                <input
                  type="text"
                  value={selectedPet.color}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Name</label>
                <input
                  type="text"
                  value={selectedPet.ownerName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Contact</label>
                <input
                  type="text"
                  value={selectedPet.ownerContact}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Owner Address</label>
                <input
                  type="text"
                  value={selectedPet.ownerAddress}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Barangay</label>
                <input
                  type="text"
                  value={selectedPet.barangay}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Microchip ID (Optional)</label>
                <input
                  type="text"
                  value={selectedPet.microchipId || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowVaccinationDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVaccinatePet(selectedPet)}
                className="px-4 py-2 bg-[#2B5EA6] text-white rounded-md hover:bg-[#234a85] transition-colors"
              >
                Vaccinate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost & Found Dialog */}
      {showLostFoundDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-gray-800 mb-4">Report Lost/Found Pet</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-600">Pet ID (Optional)</label>
                <input
                  type="text"
                  value={lostFoundReport.petId}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, petId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Type</label>
                <select
                  value={lostFoundReport.type}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, type: e.target.value as 'Lost' | 'Found' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                >
                  <option value="Lost">Lost</option>
                  <option value="Found">Found</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Reported By</label>
                <input
                  type="text"
                  value={lostFoundReport.reportedBy}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, reportedBy: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Contact Number</label>
                <input
                  type="text"
                  value={lostFoundReport.contactNumber}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, contactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Last Seen Location</label>
                <input
                  type="text"
                  value={lostFoundReport.lastSeenLocation}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, lastSeenLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Barangay</label>
                <select
                  value={lostFoundReport.barangay}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, barangay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Description</label>
                <textarea
                  value={lostFoundReport.description}
                  onChange={(e) => setLostFoundReport({ ...lostFoundReport, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLostFoundDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLostFoundReport}
                className="px-4 py-2 bg-[#2B5EA6] text-white rounded-md hover:bg-[#234a85] transition-colors"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Dialog */}
      {showScheduleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-gray-800 mb-4">Add Barangay Schedule</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-gray-600">Barangay</label>
                <select
                  value={barangaySchedule.barangay}
                  onChange={(e) => setBarangaySchedule({ ...barangaySchedule, barangay: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(barangay => (
                    <option key={barangay} value={barangay}>{barangay}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Date</label>
                <input
                  type="date"
                  value={barangaySchedule.date}
                  onChange={(e) => setBarangaySchedule({ ...barangaySchedule, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Time</label>
                <input
                  type="text"
                  value={barangaySchedule.time}
                  onChange={(e) => setBarangaySchedule({ ...barangaySchedule, time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Location</label>
                <input
                  type="text"
                  value={barangaySchedule.location}
                  onChange={(e) => setBarangaySchedule({ ...barangaySchedule, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-gray-600">Capacity</label>
                <input
                  type="number"
                  value={barangaySchedule.capacity}
                  onChange={(e) => setBarangaySchedule({ ...barangaySchedule, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2B5EA6] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowScheduleDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchedule}
                className="px-4 py-2 bg-[#2B5EA6] text-white rounded-md hover:bg-[#234a85] transition-colors"
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}