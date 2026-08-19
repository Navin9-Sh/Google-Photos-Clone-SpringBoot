package project.backend.exception;

public class BadRequestException extends RuntimeException{

    public BadRequestException(String message){
        super("AI usage limit reached. Please try again later, or try again with a different ImageKit account.");
    }
}
