export interface EmployeeProfileInfo {
  // Personal
  bloodGroup?: string;
  dob?: string;
  nationality?: string;
  maritalStatus?: string;
  marriageDate?: string;
  spouse?: string;
  placeOfBirth?: string;
  residentialStatus?: string;
  fatherName?: string;
  religion?: string;
  physicallyChallenged?: string;
  internationalEmployee?: string;
  height?: string;
  weight?: string;
  identificationMark?: string;

  // Address
  presentAddress?: string;
  permanentAddress?: string;

  // Education
  educationDegree?: string;
  educationInstitution?: string;
  educationYear?: string;
  educationStatus?: string;

  // Accounts & Statutory
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountType?: string;
  branch?: string;
  panNumber?: string;
  pfNumber?: string;
  uanNumber?: string;
  esiNumber?: string;

  // Family
  fatherDob?: string;
  fatherBloodGroup?: string;
  fatherGender?: string;
  fatherNationality?: string;
  nominationDetails?: string;

  // Employment & Job
  costCenter?: string;
  department?: string;
  designation?: string;
  division?: string;
  grade?: string;
  location?: string;
  reportingTo?: string;
  extension?: string;

  // Assets
  laptopModel?: string;
  laptopTag?: string;
  rfidCardId?: string;
  assetStatus?: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'TRAINEE' | 'INTERN' | string;
  status: 'ACTIVE' | 'INACTIVE';
  profileData?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeRequest {
  employeeCode: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  password?: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'TRAINEE' | 'INTERN' | string;
  status: 'ACTIVE' | 'INACTIVE';
  profileData?: string;
}
