export interface AnalyticsData {
  totalUsers: number;
  totalResumes: number;
  totalPortfolios: number;
  totalCoverLetters: number;
  totalFeedbacks: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: { date: string; count: number }[];
}
