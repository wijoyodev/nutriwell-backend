export const phoneNumberChecker = (phone: string) => {
  if (phone.startsWith('8')) return `0${phone}`;
  if (phone.startsWith('+')) return `0${phone.slice(3)}`;
  return phone;
};

export const referralCodeGenerator = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export const identityGenerator = (role: string) => {
  let userId = 'UN';
  switch (role) {
    case '1':
    case '2':
    case '3':
      userId = 'AD';
      break;
    case '4':
      userId = 'CU';
      break;
    case '5':
      userId = 'DI';
      break;
    default:
      break;
  }
  return userId;
};
