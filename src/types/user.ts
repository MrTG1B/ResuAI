import type { PlanId } from './subscription';

export interface User {
    id: string;
    name: string;
    email: string;
    resumes: number;
    portfolios: number;
    plan?: PlanId;
}
