# I APP — Field / Dropdown Audit

Basis: verified React snapshot dated 2026-09-05 plus the field definitions visible in the migrated application.

## Rules applied

1. Categorical values with a finite, clinically/business-defined set use a dropdown.
2. Reference data such as clinic, doctor, patient, service, account and payment method comes from the database and only active records are offered by picker services.
3. Continuous measurements remain numeric inputs with constraints and optional quick-value dropdowns; they are not forced into a giant select.
4. Free text remains available where the clinician may legitimately need a value outside the suggestion list.
5. Historical/retired database values are readable but are not added as new-entry options.

## Reviewed fields

### Appointments
- Clinic: dynamic active-clinic dropdown — OK.
- Doctor: dynamic doctor dropdown — OK.
- Patient: search + selection — OK; avoids permanent guest text.
- New-patient gender: finite dropdown (male/female for this booking flow) — OK.
- Appointment date/time: date + server-generated available-slot choices — OK.
- Appointment type: dynamic categorical field — reviewed; should use the canonical visit/appointment type list wherever displayed.

### Visit
- Visit type: canonical 8-value dropdown from `VISIT_TYPE` — OK.
- Chief complaint: suggestion dropdown + free text — intentional; clinical flexibility preserved.
- Visit date: date input — correct type, not a dropdown.
- Summary/notes: free text — correct.

### Examination
- VA UCVA / BCVA / PH: quick-value dropdown + direct input — OK.
- IOP: numeric input with 10–30 quick values — applied; continuous range remains editable.
- IOP method: canonical six-value dropdown — applied; previously stored in state but not rendered.
- IOP time: native time input — correct.
- Refraction SPH/CYL/AXIS/ADD: numeric inputs with clinical step rules — intentionally not dropdowns.
- Anterior segment findings: per-field finite suggestion dropdown + free text — OK.
- Posterior segment findings: per-field finite suggestion dropdown + free text — OK.
- Color vision / contrast / cover test: finite suggestion dropdowns — OK.
- Diagnosis: canonical suggestion dropdown + free text — OK.
- Diagnosis eye: OD/OS/OU dropdown — OK.
- Follow-up date: date input — correct.
- Treatment plan: finite suggestion dropdown + free text — OK.

### Medication prescription
- Drug name: active medication catalogue dropdown + free text fallback — intentional.
- Frequency: canonical ophthalmic frequency dropdown — OK.
- Duration: suggestion dropdown + free text — applied.
- Eye: OD/OS/OU dropdown — OK.

### Imaging / investigations
- Modality: canonical active modality dropdown — OK.
- Eye: OD/OS/OU dropdown — OK.
- Urgency: routine / urgent / stat dropdown — OK.
- Study date / order date: date inputs — correct.
- Device, indication, notes: free text — correct.

### Accounting
- Account kind: cash / bank / other dropdown — OK.
- Account clinic: active clinic dropdown + shared option — OK.
- Clinic filters: active clinic dropdown + all option — OK.
- Service: active service catalogue dropdown — OK.
- Expense category: configurable active category dropdown — OK.
- Payment method (new ledger): configurable active DB dropdown — OK.
- Transfer from/to account: account dropdowns — OK.
- Refund original transaction: eligible transaction dropdown — OK.
- Dates/amounts: native date/number inputs — correct.

### Reporting
- Report language: Arabic / English / bilingual — OK.
- Recipient: patient / referring physician — OK.

### Intentional non-dropdown fields
Doctor name/title, service/category free-form metadata, addresses, phone numbers, clinical notes, indication, device, diagnosis free text, treatment free text and continuous optical measurements should not be forced into a dropdown merely for uniformity.

## Applied in this pass

- Added the missing IOP Method dropdown to `ExaminationForm`.
- Added 10–30 IOP quick-value choices while preserving numeric entry.
- Added medication duration quick choices while preserving custom entry.
- Centralized canonical categorical option lists used by these forms.
- Converted the service `category` field in the admin service editor from unrestricted text to a controlled category dropdown.

## Deferred / requires schema or product decision

- Legacy `DoctorPayments` still uses the old `iapp.payments` payment-method enum, while the new accounting ledger uses configurable `payment_methods`. These should be unified only when the legacy payment path is formally retired; changing it now would mix two accounting contracts.
- Service categories are not a database enum today, so the new category list is a UI governance rule, not a database constraint. Existing historical categories remain readable.
