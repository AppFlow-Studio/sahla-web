const REQUIREMENT_LABELS: Record<string, string> = {
  "business_profile.url": "Business website URL",
  "business_profile.mcc": "Business category",
  "business_profile.product_description": "Description of services",
  "company.address.city": "Business city",
  "company.address.line1": "Business address",
  "company.address.postal_code": "Business ZIP code",
  "company.address.state": "Business state",
  "company.name": "Legal business name",
  "company.phone": "Business phone number",
  "company.tax_id": "Tax ID (EIN)",
  "external_account": "Bank account for payouts",
  "individual.address.city": "Representative city",
  "individual.address.line1": "Representative address",
  "individual.address.postal_code": "Representative ZIP code",
  "individual.address.state": "Representative state",
  "individual.dob.day": "Date of birth",
  "individual.dob.month": "Date of birth",
  "individual.dob.year": "Date of birth",
  "individual.email": "Email address",
  "individual.first_name": "First name",
  "individual.last_name": "Last name",
  "individual.phone": "Phone number",
  "individual.ssn_last_4": "Last 4 digits of SSN",
  "individual.verification.document": "Identity document",
  "tos_acceptance.date": "Terms of service acceptance",
  "tos_acceptance.ip": "Terms of service acceptance",
};

export function humanizeRequirement(req: string): string {
  return REQUIREMENT_LABELS[req] || req.replace(/[._]/g, " ");
}
