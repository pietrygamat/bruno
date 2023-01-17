import React, { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { createCollection } from 'providers/ReduxStore/slices/collections/actions';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';

const CreateCollection = ({ onClose }) => {
  const inputRef = useRef();
  const dispatch = useDispatch();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      collectionName: '',
      collectionLocation: ''
    },
    validationSchema: Yup.object({
      collectionName: Yup.string().min(1, 'must be atleast 1 characters').max(50, 'must be 50 characters or less').required('name is required')
    }),
    onSubmit: (values) => {
      dispatch(createCollection(values.collectionName, values.collectionLocation))
        .then(() => {
          toast.success('Collection created');
          onClose();
        })
        .catch(() => toast.error('An error occured while creating the collection'));
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        formik.setFieldValue('collectionLocation', dirPath);
      })
      .catch((error) => {
        formik.setFieldValue('collectionLocation', '');
        console.error(error);
      });
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => formik.handleSubmit();

  return (
    <Modal size="sm" title="Create Collection" confirmText="Create" handleConfirm={onSubmit} handleCancel={onClose}>
      <form className="bruno-form" onSubmit={formik.handleSubmit}>
        <div>
          <label htmlFor="collectionName" className="block font-semibold">
            Name
          </label>
          <input
            id="collection-name"
            type="text"
            name="collectionName"
            ref={inputRef}
            className="block textbox mt-2 w-full"
            onChange={formik.handleChange}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={formik.values.collectionName || ''}
          />
          {formik.touched.collectionName && formik.errors.collectionName ? <div className="text-red-500">{formik.errors.collectionName}</div> : null}

          <>
            <label htmlFor="collectionLocation" className="block font-semibold mt-3">
              Location
            </label>
            <input
              id="collection-location"
              type="text"
              name="collectionLocation"
              readOnly={true}
              className="block textbox mt-2 w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formik.values.collectionLocation || ''}
              onClick={browse}
            />
          </>
          {formik.touched.collectionLocation && formik.errors.collectionLocation ? (
            <div className="text-red-500">{formik.errors.collectionLocation}</div>
          ) : null}

          <div className="mt-1">
            <span className="text-link cursor-pointer hover:underline" onClick={browse}>
              Browse
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCollection;
