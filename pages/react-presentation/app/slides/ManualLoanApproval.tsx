import React, {
  useState,
  useEffect,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { appState } from "../state/appState";
import { observer } from "@legendapp/state/react";
import { useDirectSalesforceAction } from "../hooks/useSalesforceOperations";
import "./ManualLoanApproval.module.css";
import {
  formatCurrency,
  formatDate,
  formatShortDate,
} from "../utilities/formatters";
import Loader from "../components/Loader";
import { s } from "@legendapp/state/observableInterfaces-CZR3_8mM";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import { debounce } from "lodash";

interface Homeowner {
  Id?: string;
  First_Name__c?: string;
  Last_Name__c?: string;
  Email__c?: string;
  Phone__c?: string;
  Role__c: "Primary" | "CoSigner";
  isNew?: boolean;
}

interface LoanDetails {
  lender: string;
  result: string;
  maxApprovedAmount: string;
  lenderProjectId: string;
}

interface FormErrors {
  loanDetails: {
    [key: string]: string;
  };
  primaryApplicant: {
    [key: string]: string;
  };
  coApplicant: {
    [key: string]: string;
  };
}

interface PreviousLoanApplication {
  Id: string;
  LoanProvider__r: { Name: string };
  Result__c: string;
  MaxApprovedLoanAmount__c: number;
  PrimaryApplicant__r: { First_Name__c: string; Last_Name__c: string };
  SecondaryApplicant__r?: { First_Name__c: string; Last_Name__c: string };
  SubmittedOn__c: string;
  CompletedOn__c: string;
}

const validationSchema = Yup.object().shape({
  loanDetails: Yup.object().shape({
    lender: Yup.string().required("Lender is required"),
    result: Yup.string().required("Result is required"),
    maxApprovedAmount: Yup.number()
      .positive("Amount must be positive")
      .required("Max approved amount is required"),
    lenderProjectId: Yup.string().required("Lender project ID is required"),
  }),
  primaryApplicant: Yup.object().shape({
    First_Name__c: Yup.string().required("First name is required"),
    Last_Name__c: Yup.string().required("Last name is required"),
    Email__c: Yup.string().email("Invalid email").required("Email is required"),
    Phone__c: Yup.string()
      .matches(/^\d{10}$/, "Phone number must be 10 digits")
      .required("Phone number is required"),
  }),
  coApplicant: Yup.object().when("$hasCoApplicant", {
    //@ts-ignore
    is: true,
    then: Yup.object().shape({
      First_Name__c: Yup.string().required("First name is required"),
      Last_Name__c: Yup.string().required("Last name is required"),
      Email__c: Yup.string()
        .email("Invalid email")
        .required("Email is required"),
      Phone__c: Yup.string()
        .matches(/^\d{10}$/, "Phone number must be 10 digits")
        .required("Phone number is required"),
    }),
    otherwise: Yup.object().shape({
      First_Name__c: Yup.string(),
      Last_Name__c: Yup.string(),
      Email__c: Yup.string().email("Invalid email"),
      Phone__c: Yup.string().matches(
        /^\d{10}$/,
        "Phone number must be 10 digits"
      ),
    }),
  }),
});

const useAsyncData = () => {
  const recordId = appState.recordId.get();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<{
    homeowners: Homeowner[];
    lenderOptions: { Name: string; Id: string }[];
    previousApplications: PreviousLoanApplication[];
  } | null>(null);

  const { refetch: getHomeowners } = useDirectSalesforceAction<Homeowner[]>(
    "SignerService.getHomeownersBySID",
    { salesOpportunityId: recordId }
  );
  const { refetch: getLenderOptions } = useDirectSalesforceAction<
    { Name: string; Id: string }[]
  >("LenderService.getLenderOptions", { salesOpportunityId: recordId });
  const { refetch: getPreviousApplications } = useDirectSalesforceAction<
    PreviousLoanApplication[]
  >("LenderService.getLoanApplicationsForSalesOpportunity", {
    salesOpportunityId: recordId,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedHomeowners, lenderOptions, previousApplications] =
          await Promise.all([
            getHomeowners(),
            getLenderOptions(),
            getPreviousApplications(),
          ]);

        setData({
          homeowners: fetchedHomeowners,
          lenderOptions: lenderOptions,
          previousApplications: previousApplications,
        });
      } catch (error) {
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [recordId]);

  return { isLoading, error, data };
};

const ManualLoanApproval: React.FC = observer(() => {
  const { isLoading, error, data } = useAsyncData();
  const { refetch: setSigner } = useDirectSalesforceAction(
    "SignerService.setSigner",
    {}
  );

  const { refetch: createSigner } = useDirectSalesforceAction(
    "SignerService.createSigner",
    {}
  );
  const recordId = appState.recordId.get();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryApplicant, setPrimaryApplicant] = useState<Homeowner>({
    Role__c: "Primary",
  } as Homeowner);
  const [coApplicant, setCoApplicant] = useState<Homeowner | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetails>(
    {} as LoanDetails
  );
  const [primaryApplicantChanged, setPrimaryApplicantChanged] = useState(false);
  const [coApplicantChanged, setCoApplicantChanged] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newlySubmittedLoan, setNewlySubmittedLoan] =
    useState<PreviousLoanApplication | null>(null);
  const previousLoansRef = useRef<HTMLDivElement>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    loanDetails: {},
    primaryApplicant: {},
    coApplicant: {},
  });

  const applicantRoleOptions = [
    { label: "Primary Applicant", value: "Primary" },
    { label: "Co-Applicant", value: "CoSigner" },
  ];

  const applicationResultOptions = [
    { label: "Pending Approval", value: "pending", color: "#FFA500" },
    {
      label: "Conditional Approval",
      value: "conditional_approval",
      color: "#1E90FF",
    },
    { label: "Approved", value: "approved", color: "#32CD32" },
    { label: "Declined", value: "declined", color: "#DC143C" },
  ];

  const { refetch: storeManualLoanApproval } = useDirectSalesforceAction(
    "LenderService.storeManualLoanApproval",
    {}
  );

  useEffect(() => {
    if (data) {
      setupApplicants(data.homeowners);
      if (data.lenderOptions.length > 0) {
        setLoanDetails((prev) => ({
          ...prev,
          lender: data.lenderOptions[0].Id,
        }));
      }
    }
  }, [data]);

  const setupApplicants = (fetchedHomeowners: Homeowner[]) => {
    if (fetchedHomeowners.length > 0) {
      setPrimaryApplicant({ ...fetchedHomeowners[0], Role__c: "Primary" });
      if (fetchedHomeowners.length > 1) {
        setCoApplicant({ ...fetchedHomeowners[1], Role__c: "CoSigner" });
      } else {
        setCoApplicant(null);
      }
    } else {
      setPrimaryApplicant({ Role__c: "Primary" } as Homeowner);
      setCoApplicant(null);
    }
  };

  const handleLoanDetailsChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setLoanDetails((prev) => ({ ...prev, [name]: value }));
    debouncedValidateField(
      name,
      value,
      //@ts-ignore
      validationSchema.fields.loanDetails,
      "loanDetails"
    );
  };

  const handleApplicantChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    applicantType: "primary" | "co"
  ) => {
    const { name, value } = event.target;
    if (applicantType === "primary") {
      setPrimaryApplicant((prev) => ({ ...prev, [name]: value }));
      setPrimaryApplicantChanged(true);
      debouncedValidateField(
        name,
        value,
        //@ts-ignore
        validationSchema.fields.primaryApplicant,
        "primaryApplicant"
      );
    } else {
      setCoApplicant((prev) =>
        prev
          ? { ...prev, [name]: value }
          : { [name]: value, Role__c: "CoSigner" }
      );
      setCoApplicantChanged(true);
      debouncedValidateField(
        name,
        value,
        //@ts-ignore
        validationSchema.fields.coApplicant,
        "coApplicant"
      );
    }
  };

  const handleApplicantContactChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    applicantType: "primary" | "co"
  ) => {
    const selectedId = event.target.value;

    if (selectedId === "new") {
      const newApplicant: Homeowner = {
        Role__c: applicantType === "primary" ? "Primary" : "CoSigner",
        isNew: true,
      };
      if (applicantType === "primary") {
        setPrimaryApplicant(newApplicant);
        setPrimaryApplicantChanged(true);
      } else {
        setCoApplicant(newApplicant);
        setCoApplicantChanged(true);
      }
    } else if (selectedId === "") {
      if (applicantType === "co") {
        setCoApplicant(null);
        setCoApplicantChanged(false);
      }
    } else {
      const selectedApplicant = data?.homeowners.find(
        (homeowner) => homeowner.Id === selectedId
      );
      if (selectedApplicant) {
        if (applicantType === "primary") {
          setPrimaryApplicant({ ...selectedApplicant, Role__c: "Primary" });
          setPrimaryApplicantChanged(false);
        } else {
          setCoApplicant({ ...selectedApplicant, Role__c: "CoSigner" });
          setCoApplicantChanged(false);
        }
      }
    }
  };

  const handleRoleChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    applicantType: "primary" | "co"
  ) => {
    const { value } = event.target;
    if (applicantType === "primary") {
      setPrimaryApplicant((prev) => ({
        ...prev,
        Role__c: value as "Primary" | "CoSigner",
      }));
      if (value === "CoSigner" && coApplicant) {
        setCoApplicant((prev) =>
          prev ? { ...prev, Role__c: "Primary" } : null
        );
      }
    } else {
      setCoApplicant((prev) =>
        prev ? { ...prev, Role__c: value as "Primary" | "CoSigner" } : null
      );
      if (value === "Primary") {
        setPrimaryApplicant((prev) => ({ ...prev, Role__c: "CoSigner" }));
      }
    }
  };

  const handleSubmit = async () => {
    // const isValid = await validateForm();
    // if (isValid) {
    //   setShowConfirmModal(true);
    // }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    // const isValid = await validateForm();
    // if (!isValid) {
    //   return;
    // }

    setShowConfirmModal(false);
    setIsSubmitting(true);

    const today = new Date().toISOString().split("T")[0];
    const fauxLoan: PreviousLoanApplication = {
      Id: "temp-" + Date.now(),
      LoanProvider__r: {
        Name:
          data?.lenderOptions.find((l) => l.Id === loanDetails.lender)?.Name ||
          "",
      },
      Result__c: loanDetails.result,
      MaxApprovedLoanAmount__c: parseFloat(loanDetails.maxApprovedAmount),
      PrimaryApplicant__r: {
        First_Name__c: primaryApplicant.First_Name__c || "",
        Last_Name__c: primaryApplicant.Last_Name__c || "",
      },
      SecondaryApplicant__r: coApplicant
        ? {
            First_Name__c: coApplicant.First_Name__c || "",
            Last_Name__c: coApplicant.Last_Name__c || "",
          }
        : undefined,
      SubmittedOn__c: today,
      CompletedOn__c: today,
    };

    setNewlySubmittedLoan(fauxLoan);

    try {
      // Update or create applicants if needed
      if (primaryApplicantChanged) {
        await updateOrCreateApplicant(primaryApplicant, "primary");
      }
      if (coApplicantChanged && coApplicant) {
        await updateOrCreateApplicant(coApplicant, "co");
      }

      const result = await storeManualLoanApproval({
        salesOpportunityId: recordId,
        result: loanDetails.result,
        lenderProjectId: loanDetails.lenderProjectId,
        maxApprovedLoanAmount: parseFloat(loanDetails.maxApprovedAmount),
        primaryApplicantId: primaryApplicant.Id,
        secondaryApplicantId: coApplicant?.Id,
        resultDecidedOn: today,
        submittedOn: today,
        completedOn: today,
        loanProviderId: loanDetails.lender,
      });

      // Update the faux loan with the real ID
      setNewlySubmittedLoan((prevLoan) =>
        prevLoan ? { ...prevLoan, Id: result.id } : null
      );
      toast.success("Loan approval submitted successfully");
      setPrimaryApplicantChanged(false);
      setCoApplicantChanged(false);
    } catch (error) {
      console.error("Error submitting loan approval:", error);
      toast.error("An error occurred while submitting the loan approval");
      setNewlySubmittedLoan(null);
    }
    setIsSubmitting(false);
  };

  // const scrollToNewLoan = useCallback(() => {
  //   setTimeout(() => {
  //     const newLoan = document.querySelector('.previous-loan-box.new-loan');
  //     if (newLoan) {
  //       newLoan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     }
  //   }, 100);
  // }, []);

  const updateOrCreateApplicant = async (
    applicant: Homeowner,
    type: "primary" | "co"
  ) => {
    try {
      if (applicant.Id) {
        // Update existing applicant
        await setSigner({ signer: applicant });
      } else {
        // Create new applicant
        const newApplicant = await createSigner({
          signer: { ...applicant, Sales_Opportunity__c: recordId },
        });
        if (type === "primary") {
          setPrimaryApplicant(newApplicant);
        } else {
          setCoApplicant(newApplicant);
        }
      }
    } catch (error) {
      console.error(`Error updating/creating ${type} applicant:`, error);
      throw error;
    }
  };

  const validateField = async (
    field: string,
    value: any,
    schema: Yup.Schema<any>,
    errorKey: "loanDetails" | "primaryApplicant" | "coApplicant"
  ) => {
    try {
      await schema.validateAt(field, { [field]: value });
      setFormErrors((prev) => ({
        ...prev,
        [errorKey]: { ...prev[errorKey], [field]: "" },
      }));
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        setFormErrors((prev) => ({
          ...prev,
          [errorKey]: { ...prev[errorKey], [field]: error.message },
        }));
      }
    }
  };

  const debouncedValidateField = debounce(validateField, 300);

  const validateForm = async () => {
    try {
      await validationSchema.validate(
        {
          loanDetails,
          primaryApplicant,
          coApplicant,
        },
        { context: { hasCoApplicant: !!coApplicant }, abortEarly: false }
      );
      setFormErrors({
        loanDetails: {},
        primaryApplicant: {},
        coApplicant: {},
      });
      return true;
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const newErrors: FormErrors = {
          loanDetails: {},
          primaryApplicant: {},
          coApplicant: {},
        };
        error.inner.forEach((err) => {
          if (err.path) {
            const [section, field] = err.path.split(".");
            if (section && field) {
              newErrors[section as keyof FormErrors][field] = err.message;
            }
          }
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  };

  const renderPreviousLoanApplications = () => {
    const allApplications = newlySubmittedLoan
      ? [newlySubmittedLoan, ...(data?.previousApplications || [])]
      : data?.previousApplications || [];

    return (
      <div className="previous-loan-grid" ref={previousLoansRef}>
        {allApplications.map((application, index) => (
          <div
            key={application.Id}
            className={`previous-loan-box ${
              index === 0 && newlySubmittedLoan ? "new-loan" : ""
            } ${application.Id === newlySubmittedLoan?.Id ? "submitting" : ""}`}
          >
            <h3>{application.LoanProvider__r.Name}</h3>
            <div
              className="result-badge"
              style={{
                backgroundColor:
                  applicationResultOptions.find(
                    (opt) => opt.value === application.Result__c
                  )?.color || "#808080",
              }}
            >
              {/* {application.Result__c} */}
              {
                applicationResultOptions.find(
                  (opt) => opt.value === application.Result__c
                )?.label
              }
            </div>
            <p>
              <strong>Max Approved Amount:</strong>{" "}
              {formatCurrency(application.MaxApprovedLoanAmount__c)}
            </p>
            <hr />
            <p>
              <strong>Primary Applicant:</strong>{" "}
              {`${application.PrimaryApplicant__r.First_Name__c} ${application.PrimaryApplicant__r.Last_Name__c}`}
            </p>
            {application.SecondaryApplicant__r && (
              <p>
                <strong>Secondary Applicant:</strong>{" "}
                {`${application.SecondaryApplicant__r.First_Name__c} ${application.SecondaryApplicant__r.Last_Name__c}`}
              </p>
            )}
            <hr />
            <p>
              <strong>Submitted:</strong>{" "}
              {formatShortDate(application.SubmittedOn__c)}
            </p>
            <p>
              <strong>Completed:</strong>{" "}
              {formatShortDate(application.CompletedOn__c)}
            </p>
            {/* {application.Id === newlySubmittedLoan?.Id && isSubmitting && (
              <div className="loan-submitting-overlay">
                <div className="loading-spinner"></div>
                <p>Submitting loan application...</p>
              </div>
            )} */}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading || !data) {
    return (
      <Loader
        contextVariables={{
          LOADER_LOGO: "https://patter-demos-mu.vercel.app/Patter_Logo.png",
          COMPANY_NAME: "Patter AI",
        }}
      />
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="manual-loan-approval-container">
      <div className="manual-loan-approval-left-column">
        <h1 className="manual-loan-approval-title">
          Previous Loan Applications
        </h1>
        {renderPreviousLoanApplications()}
      </div>
      <div className="manual-loan-approval-right-column">
        <h1 className="manual-loan-approval-title">
          Add a New Loan Application
        </h1>
        <div className="manual-loan-approval-section">
          <div className="manual-loan-approval-grid">
            <div className="manual-loan-details">
              <h2 className="manual-loan-approval-subtitle">
                Loan Application Details
              </h2>
              <select
                className={`manual-loan-approval-select ${
                  formErrors.loanDetails.lender ? "error" : ""
                }`}
                name="lender"
                value={loanDetails.lender}
                onChange={handleLoanDetailsChange}
              >
                <option value="">Select Lender</option>
                {data.lenderOptions.map((lender) => (
                  <option key={lender.Id} value={lender.Id}>
                    {lender.Name}
                  </option>
                ))}
              </select>
              {formErrors.loanDetails.lender && (
                <div className="error-message">
                  {formErrors.loanDetails.lender}
                </div>
              )}
              <select
                className={`manual-loan-approval-select ${
                  formErrors.loanDetails.result ? "error" : ""
                }`}
                name="result"
                value={loanDetails.result}
                onChange={handleLoanDetailsChange}
              >
                <option value="">Select Result</option>
                {applicationResultOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.loanDetails.result && (
                <div className="error-message">
                  {formErrors.loanDetails.result}
                </div>
              )}
              <input
                className={`manual-loan-approval-input ${
                  formErrors.loanDetails.maxApprovedAmount ? "error" : ""
                }`}
                type="number"
                name="maxApprovedAmount"
                value={loanDetails.maxApprovedAmount}
                onChange={handleLoanDetailsChange}
                placeholder="Max Approved Amount"
              />
              {formErrors.loanDetails.maxApprovedAmount && (
                <div className="error-message">
                  {formErrors.loanDetails.maxApprovedAmount}
                </div>
              )}
              <input
                className={`manual-loan-approval-input ${
                  formErrors.loanDetails.lenderProjectId ? "error" : ""
                }`}
                type="text"
                name="lenderProjectId"
                value={loanDetails.lenderProjectId}
                onChange={handleLoanDetailsChange}
                placeholder="Lender Project Id"
              />
              {formErrors.loanDetails.lenderProjectId && (
                <div className="error-message">
                  {formErrors.loanDetails.lenderProjectId}
                </div>
              )}
            </div>
            <div className="manual-applicant-details">
              <h2 className="manual-loan-approval-subtitle">
                Primary Applicant
              </h2>
              {primaryApplicantChanged && (
                <span className="manual-loan-approval-change-indicator">
                  Changes Pending
                </span>
              )}
              <select
                className="manual-loan-approval-select"
                value={primaryApplicant.Id || "new"}
                onChange={(e) => handleApplicantContactChange(e, "primary")}
              >
                <option value="new">-- New Applicant --</option>
                {data.homeowners.map((homeowner) => (
                  <option key={homeowner.Id} value={homeowner.Id}>
                    {`${homeowner.First_Name__c} ${homeowner.Last_Name__c}`}
                  </option>
                ))}
              </select>
              <select
                className="manual-loan-approval-select"
                value={primaryApplicant.Role__c}
                onChange={(e) => handleRoleChange(e, "primary")}
              >
                {applicantRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className={`manual-loan-approval-input ${
                  formErrors.primaryApplicant.First_Name__c ? "error" : ""
                }`}
                type="text"
                name="First_Name__c"
                value={primaryApplicant.First_Name__c || ""}
                onChange={(e) => handleApplicantChange(e, "primary")}
                placeholder="First Name"
              />
              {formErrors.primaryApplicant.First_Name__c && (
                <div className="error-message">
                  {formErrors.primaryApplicant.First_Name__c}
                </div>
              )}
              <input
                className={`manual-loan-approval-input ${
                  formErrors.primaryApplicant.Last_Name__c ? "error" : ""
                }`}
                type="text"
                name="Last_Name__c"
                value={primaryApplicant.Last_Name__c || ""}
                onChange={(e) => handleApplicantChange(e, "primary")}
                placeholder="Last Name"
              />
              {formErrors.primaryApplicant.Last_Name__c && (
                <div className="error-message">
                  {formErrors.primaryApplicant.Last_Name__c}
                </div>
              )}
              <input
                className={`manual-loan-approval-input ${
                  formErrors.primaryApplicant.Email__c ? "error" : ""
                }`}
                type="email"
                name="Email__c"
                value={primaryApplicant.Email__c || ""}
                onChange={(e) => handleApplicantChange(e, "primary")}
                placeholder="Email"
              />
              {formErrors.primaryApplicant.Email__c && (
                <div className="error-message">
                  {formErrors.primaryApplicant.Email__c}
                </div>
              )}
              <input
                className={`manual-loan-approval-input ${
                  formErrors.primaryApplicant.Phone__c ? "error" : ""
                }`}
                type="tel"
                name="Phone__c"
                value={primaryApplicant.Phone__c || ""}
                onChange={(e) => handleApplicantChange(e, "primary")}
                placeholder="Phone Number"
              />
              {formErrors.primaryApplicant.Phone__c && (
                <div className="error-message">
                  {formErrors.primaryApplicant.Phone__c}
                </div>
              )}
            </div>
            <div className="manual-applicant-details">
              <h2 className="manual-loan-approval-subtitle">Co-Applicant</h2>
              {coApplicantChanged && (
                <span className="manual-loan-approval-change-indicator">
                  Changes Pending
                </span>
              )}
              <select
                className="manual-loan-approval-select"
                value={coApplicant?.Id || ""}
                onChange={(e) => handleApplicantContactChange(e, "co")}
              >
                <option value="">-- None --</option>
                <option value="new">-- New Applicant --</option>
                {data.homeowners.map((homeowner) => (
                  <option key={homeowner.Id} value={homeowner.Id}>
                    {`${homeowner.First_Name__c} ${homeowner.Last_Name__c}`}
                  </option>
                ))}
              </select>
              {coApplicant && (
                <>
                  <select
                    className="manual-loan-approval-select"
                    value={coApplicant.Role__c}
                    onChange={(e) => handleRoleChange(e, "co")}
                  >
                    {applicantRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`manual-loan-approval-input ${
                      formErrors.coApplicant.First_Name__c ? "error" : ""
                    }`}
                    type="text"
                    name="First_Name__c"
                    value={coApplicant.First_Name__c || ""}
                    onChange={(e) => handleApplicantChange(e, "co")}
                    placeholder="First Name"
                  />
                  {formErrors.coApplicant.First_Name__c && (
                    <div className="error-message">
                      {formErrors.coApplicant.First_Name__c}
                    </div>
                  )}
                  <input
                    className={`manual-loan-approval-input ${
                      formErrors.coApplicant.Last_Name__c ? "error" : ""
                    }`}
                    type="text"
                    name="Last_Name__c"
                    value={coApplicant.Last_Name__c || ""}
                    onChange={(e) => handleApplicantChange(e, "co")}
                    placeholder="Last Name"
                  />
                  {formErrors.coApplicant.Last_Name__c && (
                    <div className="error-message">
                      {formErrors.coApplicant.Last_Name__c}
                    </div>
                  )}
                  <input
                    className={`manual-loan-approval-input ${
                      formErrors.coApplicant.Email__c ? "error" : ""
                    }`}
                    type="email"
                    name="Email__c"
                    value={coApplicant.Email__c || ""}
                    onChange={(e) => handleApplicantChange(e, "co")}
                    placeholder="Email"
                  />
                  {formErrors.coApplicant.Email__c && (
                    <div className="error-message">
                      {formErrors.coApplicant.Email__c}
                    </div>
                  )}
                  <input
                    className={`manual-loan-approval-input ${
                      formErrors.coApplicant.Phone__c ? "error" : ""
                    }`}
                    type="tel"
                    name="Phone__c"
                    value={coApplicant.Phone__c || ""}
                    onChange={(e) => handleApplicantChange(e, "co")}
                    placeholder="Phone Number"
                  />
                  {formErrors.coApplicant.Phone__c && (
                    <div className="error-message">
                      {formErrors.coApplicant.Phone__c}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="manual-loan-approval-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Loan Application Result"}
        </button>
      </div>
      {showConfirmModal && (
        <div className="manual-loan-approval-modal">
          <div className="manual-loan-approval-modal-content">
            <h2 className="manual-loan-approval-subtitle">
              Confirm Submission
            </h2>
            <p>Are you sure you want to submit this loan approval?</p>
            <div className="manual-loan-approval-modal-buttons">
              <button
                className="manual-loan-approval-button"
                onClick={confirmSubmit}
              >
                Yes, Submit
              </button>
              <button
                className="manual-loan-approval-button"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ManualLoanApproval;
