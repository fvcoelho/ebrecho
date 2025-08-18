import { Request, Response, NextFunction } from 'express';
import { userAnalyticsService } from '../services/user-analytics.service';
import { 
  CreateSessionInput,
  CreatePageViewInput,
  CreateActivityInput,
  AnalyticsQueryInput,
  SessionDetailQueryInput,
  DashboardStatsQueryInput
} from '../schemas/analytics.schemas';
import { AuthRequest } from '../types';

export const createSession = async (
  req: Request<{}, {}, CreateSessionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await userAnalyticsService.createSession(req.body);
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (
  req: Request<{ sessionId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const session = await userAnalyticsService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (
  req: Request<{ sessionId: string }, {}, Partial<CreateSessionInput>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const session = await userAnalyticsService.updateSession(sessionId, req.body);
    
    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const trackPageView = async (
  req: Request<{}, {}, CreatePageViewInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const pageView = await userAnalyticsService.trackPageView(req.body);
    
    res.status(201).json({
      success: true,
      data: pageView,
      message: 'Page view tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const trackActivity = async (
  req: Request<{}, {}, CreateActivityInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const activity = await userAnalyticsService.trackActivity(req.body);
    
    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity tracked successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivities = async (
  req: Request<{}, {}, {}, AnalyticsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const result = await userAnalyticsService.getRecentActivities(query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentPageViews = async (
  req: Request<{}, {}, {}, AnalyticsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const result = await userAnalyticsService.getRecentPageViews(query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (
  req: Request<{}, {}, {}, AnalyticsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const result = await userAnalyticsService.getSessions(query);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (
  req: Request<{}, {}, {}, DashboardStatsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const stats = await userAnalyticsService.getDashboardStats(query);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getComprehensiveAnalytics = async (
  req: Request<{}, {}, {}, AnalyticsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const analytics = await userAnalyticsService.getComprehensiveAnalytics(query);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// This is the endpoint that the existing frontend expects
export const getRecentAnalytics = async (
  req: Request<{}, {}, {}, AnalyticsQueryInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthRequest;
    
    // If user is not admin, scope to their partner
    const query = { ...req.query };
    if (authReq.user?.role !== 'ADMIN' && authReq.user?.partnerId) {
      query.partnerId = authReq.user.partnerId;
    }
    
    const analytics = await userAnalyticsService.getComprehensiveAnalytics(query);
    
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};