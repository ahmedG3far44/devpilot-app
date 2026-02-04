import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "./card";

const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="min-h-screen flex items-start justify-center gap-2 mt-40">
      <Card className="min-w-[400px] flex items-center justify-center gap-4  text-center px-4 py-8">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto " />
        <h2 className="text-lg font-bold text-primary text-wrap text-center w-3/4">
          Something went wrong and failed to load project
        </h2>
        <p className="text-muted-foreground text-xs mb-2 space-x-2 w-3/4">
          <span>{message}</span>
          <span>please try again later!!</span>
        </p>
        <Link
          to={"/"}
          className="w-full text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-65 duration-300  hover:bg-red-800"
        >
          Back to Home
        </Link>
      </Card>
    </div>
  );
};

export default ErrorMessage;
