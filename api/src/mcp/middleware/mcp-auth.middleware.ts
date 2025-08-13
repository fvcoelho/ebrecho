import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: User & { partnerId?: string };
  mcpSession?: {
    authenticated: boolean;
    userId?: string;
    role?: string;
    partnerId?: string;
  };
}

export const mcpAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Initialize MCP session
    req.mcpSession = {
      authenticated: false
    };

    // Check for authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For MCP, we might want to allow some endpoints without auth
      // or provide limited access
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        email: string;
        role: string;
        partnerId?: string;
      };

      // Set authenticated session info
      req.mcpSession = {
        authenticated: true,
        userId: decoded.userId,
        role: decoded.role,
        partnerId: decoded.partnerId
      };

      // Also set user info for compatibility with existing middleware
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as any,
        partnerId: decoded.partnerId || null
      } as any;

      next();
    } catch (jwtError) {
      console.error('Invalid JWT token for MCP:', jwtError);
      // Don't fail completely, just mark as unauthenticated
      next();
    }
  } catch (error) {
    console.error('MCP Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based access control for MCP endpoints
export const mcpRequireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.mcpSession?.authenticated) {
      return res.status(401).json({ 
        error: 'Authentication required for this MCP endpoint' 
      });
    }

    if (!req.mcpSession.role || !allowedRoles.includes(req.mcpSession.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions for this MCP endpoint',
        required: allowedRoles,
        current: req.mcpSession.role
      });
    }

    next();
  };
};

// Partner scope validation for MCP
export const mcpValidatePartnerScope = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const partnerId = req.params.partnerId || req.body.partnerId || req.query.partnerId;
  
  if (!partnerId) {
    return next(); // No partner scope required
  }

  // System admins can access any partner's data
  if (req.mcpSession?.role === 'ADMIN') {
    return next();
  }

  // Partner users can only access their own data
  if (req.mcpSession?.partnerId !== partnerId) {
    return res.status(403).json({ 
      error: 'Access denied: Cannot access other partner\'s data',
      requestedPartner: partnerId,
      userPartner: req.mcpSession?.partnerId
    });
  }

  next();
};