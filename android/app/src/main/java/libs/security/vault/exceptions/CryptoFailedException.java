package libs.security.vault.exceptions;

import java.security.GeneralSecurityException;

public class CryptoFailedException extends GeneralSecurityException {
    private final String code;

    public CryptoFailedException(String message, Throwable t) {
        this("-1", message, t);
    }

    public CryptoFailedException(String code, String message, Throwable t) {
        super(message, t);
        this.code = code != null ? code : "-1";
    }

    public String getCode() {
        return code;
    }
}
