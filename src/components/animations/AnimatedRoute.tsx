import { ReactElement } from 'react';
import { PageWrapper } from './PageWrapper';

interface AnimatedRouteProps {
  element: ReactElement;
}

export const AnimatedRoute = ({ element }: AnimatedRouteProps) => {
  return <PageWrapper>{element}</PageWrapper>;
};

