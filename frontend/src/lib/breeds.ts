// Common breeds for the searchable breed dropdown. "Others" is appended by the component.
export const DOG_BREEDS: string[] = [
  'Aspin (Asong Pinoy)', 'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute',
  'American Bulldog', 'American Pit Bull Terrier', 'American Staffordshire Terrier', 'Australian Cattle Dog',
  'Australian Shepherd', 'Basenji', 'Basset Hound', 'Beagle', 'Belgian Malinois', 'Bernese Mountain Dog',
  'Bichon Frise', 'Bloodhound', 'Border Collie', 'Boston Terrier', 'Boxer', 'Bulldog (English)', 'Bull Terrier',
  'Cairn Terrier', 'Cavalier King Charles Spaniel', 'Chihuahua', 'Chow Chow', 'Cocker Spaniel', 'Collie',
  'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'French Bulldog', 'German Shepherd', 'Golden Retriever',
  'Great Dane', 'Greyhound', 'Havanese', 'Husky (Siberian)', 'Jack Russell Terrier', 'Japanese Spitz',
  'Labrador Retriever', 'Lhasa Apso', 'Maltese', 'Mastiff', 'Miniature Pinscher', 'Miniature Schnauzer',
  'Newfoundland', 'Pekingese', 'Pomeranian', 'Poodle (Miniature)', 'Poodle (Standard)', 'Poodle (Toy)', 'Pug',
  'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Samoyed', 'Schnauzer', 'Shar Pei', 'Shiba Inu',
  'Shih Tzu', 'Staffordshire Bull Terrier', 'Weimaraner', 'West Highland White Terrier', 'Whippet',
  'Yorkshire Terrier', 'Mixed Breed',
];

export const CAT_BREEDS: string[] = [
  'Puspin (Pusang Pinoy)', 'Abyssinian', 'American Shorthair', 'Balinese', 'Bengal', 'Birman', 'Bombay',
  'British Shorthair', 'Burmese', 'Chartreux', 'Cornish Rex', 'Devon Rex', 'Domestic Longhair',
  'Domestic Shorthair', 'Egyptian Mau', 'Exotic Shorthair', 'Himalayan', 'Maine Coon', 'Manx',
  'Norwegian Forest Cat', 'Oriental Shorthair', 'Persian', 'Ragdoll', 'Russian Blue', 'Savannah',
  'Scottish Fold', 'Siamese', 'Siberian', 'Singapura', 'Somali', 'Sphynx', 'Tonkinese', 'Turkish Angora',
  'Mixed Breed',
];

export function breedsFor(species: string): string[] | null {
  const s = (species || '').toLowerCase();
  if (s === 'dog') return DOG_BREEDS;
  if (s === 'cat') return CAT_BREEDS;
  return null;
}
