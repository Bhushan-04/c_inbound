// __mocks__/bcrypt.ts (Corrected)
// Use named exports to ensure TypeScript knows the structure
export const hash = jest.fn(() => Promise.resolve('mockHashedPassword'));
export const genSalt = jest.fn(() => Promise.resolve('mockSalt'));
export const compare = jest.fn(() => Promise.resolve(true));