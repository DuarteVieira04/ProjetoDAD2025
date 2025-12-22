<?php

namespace App\Game;

class Card
{
    public function __construct(
        public readonly BiscaSuit $suit,
        public readonly BiscaRank $rank
    ) {
    }

    public function getPoints(): int
    {
        return $this->rank->getPoints();
    }

    public function toString(): string
    {
        return $this->rank->value . ' of ' . $this->suit->value;
    }
}
