import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 md:p-12 text-center">
          {/* Icon */}

          <h4 className='text-6xl font-black text-violet-700 my-4'>404</h4>

          {/* Error Message */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-muted-foreground mb-3">
            Oops! The page you're looking for doesn't exist.
          </p>

          <p className="text-muted-foreground max-w-lg mx-auto mb-10">
            It might have been moved, deleted, or the URL might be incorrect.
            Don't worry though, you can find plenty of other things on our homepage.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGoHome}
              size="lg"
              variant={"outline"}
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </div>

          {/* Support link */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <a
                href="/contact"
                className="text-primary hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;