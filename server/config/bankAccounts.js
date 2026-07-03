// config/bankAccounts.js
module.exports = {
  companyBankAccounts: [
    {
      id: 'bpi',
      name: 'BPI',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Bank of the Philippine Islands'
    },
    {
      id: 'unionbank',
      name: 'UnionBank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'UnionBank of the Philippines'
    },
    {
      id: 'bdo',
      name: 'BDO',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'BDO Unibank'
    },
    {
      id: 'metrobank',
      name: 'Metrobank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Metropolitan Bank & Trust Company'
    },
    {
      id: 'landbank',
      name: 'Landbank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Land Bank of the Philippines'
    },
    {
      id: 'security_bank',
      name: 'Security Bank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Security Bank Corporation'
    },
    {
      id: 'chinabank',
      name: 'China Bank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'China Banking Corporation'
    },
    {
      id: 'pnb',
      name: 'PNB',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Philippine National Bank'
    },
    {
      id: 'eastwest',
      name: 'EastWest Bank',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'EastWest Banking Corporation'
    },
    {
      id: 'rcbc',
      name: 'RCBC',
      accountName: 'SALFER ENGINEERING CORP',
      accountNumber: '1234-5678-9012',
      description: 'Rizal Commercial Banking Corporation'
    }
  ],
  
  getBankById: (id) => {
    return module.exports.companyBankAccounts.find(bank => bank.id === id);
  },
  
  getBankByName: (name) => {
    return module.exports.companyBankAccounts.find(bank => bank.name === name);
  }
};