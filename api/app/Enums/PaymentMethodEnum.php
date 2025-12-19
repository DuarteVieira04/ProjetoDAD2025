<?php 

namespace App\Enums;


enum PaymentMethodEnum: string
{
    case MBWAY = 'MBWAY';
    case IBAN = 'IBAN';
    case MB = 'MB';
    case VISA = 'VISA';
    case PAYPAL = 'PAYPAL';
}
