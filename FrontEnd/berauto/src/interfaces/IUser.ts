export interface IUserProfile {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    phoneNumber?: string;
    licenceId?: string;
    password?: string;
    address?: string;
}

export interface IUserUpdateDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string | null;
    licenceId?: string | null;
    address?: string | null;
}


