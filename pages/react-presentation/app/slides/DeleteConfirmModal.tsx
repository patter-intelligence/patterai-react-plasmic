import React from 'react';
import './ContactConfirmation.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ContactItem } from '../types';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  contact: ContactItem | null;
  isDeleting: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 500,
    },
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    y: 20,
    transition: { 
      duration: 0.2,
    },
  },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onConfirm, onCancel, contact, isDeleting }) => {
  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cc-delete-modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="cc-delete-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h2 
              className="cc-delete-modal-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Confirm Deletion
            </motion.h2>
            <motion.p 
              className="cc-delete-modal-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Are you sure you want to delete the contact "{contact.First_Name__c} {contact.Last_Name__c}"?
            </motion.p>
            <motion.div 
              className="cc-delete-modal-buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                className="cc-button cc-contained cc-delete-confirm"
                onClick={onConfirm}
                disabled={isDeleting}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {isDeleting ? (
                  <motion.div
                    className="cc-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Delete
                  </motion.span>
                )}
              </motion.button>
              <motion.button
                className="cc-button cc-text cc-delete-cancel"
                onClick={onCancel}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
