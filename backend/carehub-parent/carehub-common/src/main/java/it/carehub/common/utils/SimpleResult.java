package it.carehub.common.utils;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SimpleResult {
    public static final String RES_OK = "OK";
    public static final String RES_KO = "KO";
    public static final String RES_WRN = "WRN";
    public static final String RES_MSG_HEADR_SUCCESS = "Operazione completata";
    public static final String RES_MSG_HEADR_FAIL = "Operazione non riuscita";
    public static final String RES_MSG_HEADR_WARNING = "Attenzione";

    private String result;
    private String resultMessageHeader;
    private String resultMessage;

    public SimpleResult(String result, String resultMessageHeader, String resultMessage) {
        this.result = result;
        this.resultMessageHeader = resultMessageHeader;
        this.resultMessage = resultMessage;
    }

    public SimpleResult success(String message) {
        this.result = RES_OK;
        this.resultMessageHeader = RES_MSG_HEADR_SUCCESS;
        this.resultMessage = message;
        return this;
    }

    public SimpleResult failure(String message) {
        this.result = RES_KO;
        this.resultMessageHeader = RES_MSG_HEADR_FAIL;
        this.resultMessage = message;
        return this;
    }

}
