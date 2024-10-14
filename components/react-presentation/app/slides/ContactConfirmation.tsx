/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { Formik, Form, Field, ErrorMessage, useField } from 'formik';
import * as Yup from 'yup';
import styles from './ContactConfirmation.module.css';
import { v4 } from 'uuid';
import { ContactItem } from '../types';
import { observer } from '@legendapp/state/react';
import { useDirectSalesforceAction } from '../hooks/useSalesforceOperations';
import { appState } from '../state/appState';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import DeleteConfirmModal, { DeleteConfirmModalProps } from './DeleteConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_CONTACTS = 3;
const LIMIT_CONTACTS = true;

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className || styles['card']}>{children}</div>;

const Button = ({
  children,
  variant = 'contained',
  ...props
}: {
  children: React.ReactNode;
  variant?: string;
  [key: string]: any;
}) => (
  <button className={`button ${variant}`} {...props}>
    <span className="button-content">{children}</span>
  </button>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="cc-info-field">
    <p className="cc-d2-med cc-info-field-label">{label}</p>
    <p className="cc-d1-semi">{value}</p>
  </div>
);

const phoneRegExp = /^\(\d{3}\) \d{3} - \d{4}$/;

const validationSchema = Yup.object().shape({
  First_Name__c: Yup.string().required('First name is required'),
  Last_Name__c: Yup.string().required('Last name is required'),
  Email__c: Yup.string()
    .email('Invalid Email address')
    .required('Email is required'),
  Phone__c: Yup.string()
    .matches(
      phoneRegExp,
      'Invalid Phone__c number format. Use (XXX) XXX - XXXX'
    )
    .required('Phone number is required'),
});

const PhoneInput = ({ name, ...props }: { name: string; [key: string]: any }) => {
  const [field, meta, helpers] = useField(name);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )} - ${phoneNumber.slice(6, 10)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    helpers.setValue(formattedPhoneNumber);
    props?.onChange?.(formattedPhoneNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && field.value.length === 1) {
      helpers.setValue('');
    }
  };

  return (
    <input
      {...field}
      {...props}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={`cc-d1-semi cc-editable-input ${meta.touched && meta.error ? 'cc-invalid' : ''}`}
    />
  );
};

const ContactForm = ({
  contact,
  onSave,
  onCancel,
}: {
  contact: ContactItem | undefined;
  onSave: (contact: ContactItem) => void;
  onCancel: () => void;
}) => {
  const initialContact = contact || {
    First_Name__c: '',
    Last_Name__c: '',
    Email__c: '',
    Phone__c: '',
    id: '',
  };

  return (
    <Formik
      initialValues={initialContact}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        onSave(values as ContactItem);
      }}
      validateOnChange={false}
      validateOnBlur={true}
    >
      {({ errors, touched }) => (
        <Form className="cc-contact-form">
          <div className="cc-info-field">
            <p className="cc-d2-med cc-info-field-label">First Name</p>
            <Field
              name="First_Name__c"
              className={`cc-d1-semi ${
                errors.First_Name__c && touched.First_Name__c
                  ? 'cc-invalid'
                  : ''
              }`}
            />
            <ErrorMessage
              name="First_Name__c"
              component="p"
              className="cc-error-message"
            />
          </div>
          <div className="cc-info-field">
            <p className="cc-d2-med cc-info-field-label">Last Name</p>
            <Field
              name="Last_Name__c"
              className={`cc-d1-semi ${
                errors.Last_Name__c && touched.Last_Name__c ? 'cc-invalid' : ''
              }`}
            />
            <ErrorMessage
              name="Last_Name__c"
              component="p"
              className="cc-error-message"
            />
          </div>
          <div className="cc-info-field">
            <p className="cc-d2-med cc-info-field-label">Email</p>
            <Field
              name="Email__c"
              type="Email__c"
              className={`cc-d1-semi  cc-email-field ${
                errors.Email__c && touched.Email__c ? 'cc-invalid' : ''
              }`}
              style={{
                width: '100%',
              }}
            />
            <ErrorMessage
              name="Email__c"
              component="p"
              className="cc-error-message"
            />
          </div>
          <div className="cc-info-field">
            <p className="cc-d2-med cc-info-field-label">Phone</p>
            <PhoneInput name="Phone__c" type="tel" />
            <ErrorMessage
              name="Phone__c"
              component="p"
              className="cc-error-message"
            />
          </div>
          <div className="cc-form-actions">
            <Button type="submit" className="cc-button cc-contained">
              Save
            </Button>
            <Button
              variant="text"
              onClick={onCancel}
              className="cc-button cc-text"
            >
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export const ContactConfirmation = observer(function ContactConfirmation({
  onNext,
}: {
  onNext: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const recordId = appState.recordId.get();

  const { result: salesforceContacts, refetch: getContacts } =
    useDirectSalesforceAction(
      'SignerService.getHomeownersBySID',
      {
        salesOpportunityId: recordId,
      },
      false
    );

  const { refetch: updateContacts } = useDirectSalesforceAction(
    'SignerService.updateSigners',
    {
      salesOpportunityId: recordId,
    },
    false
  );

  const { refetch: deleteSigners } = useDirectSalesforceAction(
    'SignerService.deleteSigners',
    {
      signerIds: [],
    },
    false
  );

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const result = await getContacts();
        console.log('Contacts:', result);
        const contacts = result.map((contact: any) => ({
          ...contact,
          id: contact.Id,
        }));
        setContacts(contacts || []);
        if (result.length === 0) {
          handleAddContact();
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSave = async (updatedContact: ContactItem) => {
    console.log('Saving contact:', updatedContact);
    updatedContact.LastModifiedDate = new Date().toISOString();
    updatedContact.SalesOpportunityId = recordId;

    const updatedContacts = contacts.map((contact) =>
      contact.id === updatedContact.id ? updatedContact : contact
    );

    // If the contact doesn't exist in the current list, add it
    if (!updatedContacts.some(contact => contact.id === updatedContact.id)) {
      updatedContacts.push(updatedContact);
    }

    console.log('Updated contacts:', updatedContacts);

    setContacts(updatedContacts);
    setEditingId(null);

    try {
      const result = await updateContacts({
        dataToSave: {
          Signer__c: updatedContacts.reduce(
            (acc: any, contact: ContactItem) => {
              acc[contact.id] = {...contact, id: undefined, attributes: undefined};
              return acc;
            },
            {}
          ),
          salesOpportunityId: recordId,
        },
      });
      console.log('Salesforce update result:', result);
      toast.success('Contact saved successfully');
    } catch (error) {
      console.error('Error updating contacts:', error);
      toast.error('Failed to save contact. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddContact = () => {
    if (!LIMIT_CONTACTS || contacts.length < MAX_CONTACTS) {
      const newContact: ContactItem = {
        First_Name__c: '',
        Last_Name__c: '',
        Email__c: '',
        Phone__c: '',
        id: v4(),
        LastModifiedDate: new Date().toISOString(),
        SalesOpportunityId: recordId,
      };

      setContacts([...contacts, newContact]);
      setEditingId(newContact.id);
    }
  };

  const handleDeleteContact = (contact: ContactItem) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const cancelDeleteContact = () => {
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  const confirmDeleteContact = async () => {
    if (contactToDelete) {
      try {
        setIsDeleting(true);
        await deleteSigners({ signerIds: [contactToDelete.id] });
        const updatedContacts = contacts.filter((contact) => contact.id !== contactToDelete.id);
        setContacts(updatedContacts);
        toast.success('Contact deleted successfully');
      } catch (error) {
        console.error('Error deleting contact:', error);
        toast.error('Failed to delete contact. Please try again.');
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
        setContactToDelete(null);
      }
    }
  };

  return (
    <>
      {isLoading && (
        <Loader
          contextVariables={{
            LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
            COMPANY_NAME: 'Patter AI',
          }}
        ></Loader>
      )}
      <Suspense
        fallback={
          <Loader
            contextVariables={{
              LOADER_LOGO: 'https://patter-demos-mu.vercel.app/Patter_Logo.png',
              COMPANY_NAME: 'Patter AI',
            }}
          ></Loader>
        }
      >
        <motion.div
          className="cc-confirm-information"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="cc-image-section">
            <div className="cc-image-container">
              <motion.img
                className={`cc-full-image cc-loaded`}
                src={
                  'https://patter-demos-mu.vercel.app/contact-confirmation-min.jpeg'
                }
                alt="Contact confirmation"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <motion.div
              className="cc-quote-overlay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="cc-d1-medium cc-quote-text">
                "Sun Co. has lived up to my high expectations. Everything I
                heard from my neighbors, read online, about them being easy to
                work with was true."
              </p>
              <p className="cc-d2-semi cc-quote-text-name">
                Robbie Truth | Metairie, LA
              </p>
            </motion.div>
          </div>

          <div className="cc-form-section">
            <motion.h1
              className="cc-h2-semi h1-semi fade-in heading"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Your Contact Details
            </motion.h1>
            <motion.div
              className="cc-form-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <AnimatePresence>
                {contacts.map((contact) => (
                  <motion.div
                    key={contact.id || v4()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <ContactRow
                      contact={contact}
                      editingId={editingId}
                      handleSave={handleSave}
                      handleCancel={handleCancel}
                      handleEdit={handleEdit}
                      handleDelete={handleDeleteContact}
                      isLoading={isLoading}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {(!LIMIT_CONTACTS || contacts.length < MAX_CONTACTS) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Button
                    variant="text"
                    className="button cc-add-contact"
                    onClick={handleAddContact}
                  >
                    + Add Additional Contact
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </Suspense>
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={confirmDeleteContact}
        onCancel={cancelDeleteContact}
        contact={contactToDelete}
        isDeleting={isDeleting}
      />
    </>
  );
});

const ContactRow = ({
  contact,
  editingId,
  handleSave,
  handleCancel,
  handleEdit,
  handleDelete,
  isLoading,
}: {
  contact: ContactItem;
  editingId: string | null;
  handleSave: (contact: ContactItem) => void;
  handleCancel: () => void;
  handleEdit: (id: string) => void;
  handleDelete: (contact: ContactItem) => void;
  isLoading: boolean;
}) => {
  const [editedContact, setEditedContact] = useState<ContactItem>(contact);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedContact((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneInputChange = (value: string) => {
    console.log('Phone input changed:', value);
    setEditedContact((prev) => ({ ...prev, Phone__c: value }));
  };

  const handleSaveClick = () => {
    console.log('Save clicked with values:', editedContact);
    handleSave(editedContact);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        key={contact.id}
        className={`cc-card ${editingId === contact.id ? 'cc-editing' : ''}`}
      >
        <div className="cc-card-header">
          <div className="cc-action-buttons">
            {editingId === contact.id ? (
              <>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    type="button"
                    variant="text"
                    aria-label="Save"
                    className="cc-save-button"
                    onClick={handleSaveClick}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
                    </svg>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    type="button"
                    variant="text"
                    onClick={handleCancel}
                    aria-label="Cancel"
                    className="cc-cancel-button"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
                    </svg>
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="text"
                    onClick={() => handleEdit(contact.id)}
                    aria-label="Edit"
                    className="cc-edit-button"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="text"
                    onClick={() => handleDelete(contact)}
                    aria-label="Delete"
                    className="cc-delete-button"
                    disabled={isLoading}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
        <div className="cc-card-content">
          {editingId === contact.id ? (
            <Formik
              initialValues={editedContact}
              onSubmit={handleSaveClick}
              validationSchema={validationSchema}
            >
              {({ values, handleChange, handleBlur, setFieldValue }) => (
                <Form>
                  <div className="cc-contact-info">
                    <div className="cc-name-row">
                      <div className="cc-name-fields">
                        <div className="cc-info-field">
                          <p className="cc-d2-med cc-info-field-label">First Name</p>
                          <Field
                            name="First_Name__c"
                            value={values.First_Name__c}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleChange(e);
                              handleInputChange(e);
                            }}
                            onBlur={handleBlur}
                            className="cc-d1-semi cc-editable-input"
                          />
                        </div>
                        <div className="cc-info-field">
                          <p className="cc-d2-med cc-info-field-label">Last Name</p>
                          <Field
                            name="Last_Name__c"
                            value={values.Last_Name__c}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleChange(e);
                              handleInputChange(e);
                            }}
                            onBlur={handleBlur}
                            className="cc-d1-semi cc-editable-input"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="cc-info-field">
                      <p className="cc-d2-med cc-info-field-label">Email</p>
                      <Field
                        name="Email__c"
                        value={values.Email__c}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleChange(e);
                          handleInputChange(e);
                        }}
                        onBlur={handleBlur}
                        className="cc-email-field cc-d1-semi cc-editable-input"
                        style={{
                          width: '104%',
                        }}
                      />
                    </div>
                    <div className="cc-info-field">
                      <p className="cc-d2-med cc-info-field-label">Phone</p>
                      <PhoneInput
                        name="Phone__c"
                        onChange={(value: string) => {
                          // console.log('Phone input changed:', value);
                          setFieldValue('Phone__c', value);
                          handlePhoneInputChange(value);
                        }}
                      />
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            <div className="cc-contact-info">
              <div className="cc-name-row">
                <div className="cc-name-fields">
                  <div className="cc-info-field">
                    <p className="cc-d2-med cc-info-field-label">First Name</p>
                    <p className="cc-d1-semi">{contact.First_Name__c}</p>
                  </div>
                  <div className="cc-info-field">
                    <p className="cc-d2-med cc-info-field-label">Last Name</p>
                    <p className="cc-d1-semi">{contact.Last_Name__c}</p>
                  </div>
                </div>
              </div>
              <div className="cc-info-field">
                <p className="cc-d2-med cc-info-field-label">Email</p>
                <p className="cc-d1-semi">{contact.Email__c}</p>
              </div>
              <div className="cc-info-field">
                <p className="cc-d2-med cc-info-field-label">Phone</p>
                <p className="cc-d1-semi">{contact.Phone__c}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ContactConfirmation;
