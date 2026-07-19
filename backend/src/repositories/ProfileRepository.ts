export interface ProfileWithRelations {
  id: string;
  name: string;
  proxy: string;
  apps: { id: string; name: string; token: string }[];
  accounts: {
    id: string;
    actId: string;
    pages: { id: string; name: string }[];
    pixels: { id: string; name: string }[];
  }[];
}

export interface ProfileRepository {
  findAllWithRelations(): Promise<ProfileWithRelations[]>;
  createWithRelations(data: any): Promise<ProfileWithRelations>;
  isActIdTaken(actId: string): Promise<boolean>;
}