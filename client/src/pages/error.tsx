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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl px-4 py-8 w-full bg-transparent border-0">
        <CardContent className="p-8 md:p-12 text-center">
            {/* Icon/Image */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <SearchX className="w-32 h-32 text-primary" strokeWidth={1.5} />
              <div className="absolute -top-2 -right-2 bg-red-500 text-primary rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold shadow-lg">
                404
              </div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Page Not Found
          </h1>
          
          <p className="text-lg text-muted-foreground mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          
          <p className="text-muted-foreground mb-8">
            It might have been moved, deleted, or the URL might be incorrect.
            Don't worry though, you can find plenty of other things on our homepage.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={handleGoHome}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>

          {/* Additional Help Text */}
          <div className="mt-12 pt-8 border-t border-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Need help? <a href="/contact" className="text-primary hover:text-primary-foreground underline">Contact support</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFoundPage;