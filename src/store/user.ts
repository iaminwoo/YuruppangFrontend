// store/user.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  userId: number;
  username: string;
};

type UserStore = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create(
  persist<UserStore>(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // localStorage 키 이름
    }
  )
);
