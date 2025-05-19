export interface IUserProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phoneNumber?: string | null;
    licenceId?: string | null;
    address?: string | null;
    // registeredUser: boolean; // Ezt valószínűleg nem itt kezeljük
    // role: string; // Ezt is a tokenből vagy máshonnan
}

export interface IUserUpdateDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string | null;
    licenceId?: string | null;
    address?: string | null;
}


