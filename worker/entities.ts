import { IndexedEntity } from "./core-utils";
import type { User, Profile, Experience } from "@shared/types";
import { seedUsers } from "@shared/mock-data";
// USER ENTITY: one DO instance per user
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = {
    id: "",
    username: "",
    passwordHash: "",
    displayName: "",
    avatarUrl: "",
    bio: "",
    links: {},
    accountType: 'person',
    experiences: [] as Experience[],
  };
  static readonly seedData = seedUsers;
  // Override keyOf to use username for indexing, as it's the public identifier
  static override keyOf(state: any): string {
    return state.username;
  }
  async getProfile(): Promise<Profile> {
    const { username, displayName, avatarUrl, bio, links, accountType, experiences } = await this.getState();
    return { username, displayName, avatarUrl, bio, links, accountType, experiences };
  }
  async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    await this.mutate(s => {
      const newState = { ...s };
      if (profileData.displayName !== undefined) {
        newState.displayName = profileData.displayName;
      }
      if (profileData.avatarUrl !== undefined) {
        newState.avatarUrl = profileData.avatarUrl;
      }
      if (profileData.bio !== undefined) {
        newState.bio = profileData.bio;
      }
      if (profileData.links !== undefined) {
        newState.links = profileData.links;
      }
      return newState;
    });
    return this.getProfile();
  }
}