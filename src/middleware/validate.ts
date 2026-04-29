import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : '',
        message: err.msg
      }))
    });
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('role').isIn(['worker', 'employer']).withMessage('Role must be either worker or employer'),
  handleValidationErrors
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const createServiceValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('budget').notEmpty().withMessage('Budget is required'),
  body('wilaya').notEmpty().withMessage('Wilaya is required'),
  handleValidationErrors
];

export const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('requestId').notEmpty().withMessage('Request ID is required'),
  handleValidationErrors
];
