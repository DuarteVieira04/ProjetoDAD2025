<?php

namespace App\Game;

enum BiscaRank: string
{
    case TWO = '2';
    case THREE = '3';
    case FOUR = '4';
    case FIVE = '5';
    case SIX = '6';
    case QUEEN = 'Q';
    case JACK = 'J';
    case KING = 'K';
    case SEVEN = '7';
    case ACE = 'A';

    public function getPoints(): int
    {
        return match ($this) {
            self::ACE => 11,
            self::SEVEN => 10,
            self::KING => 4,
            self::JACK => 3,
            self::QUEEN => 2,
            default => 0,
        };
    }
}
