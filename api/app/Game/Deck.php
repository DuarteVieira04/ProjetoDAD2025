<?php

namespace App\Game;

use Illuminate\Support\Collection;

class Deck
{
    /** @var Collection<int, Card> */
    private Collection $cards;

    public function __construct()
    {
        $this->cards = collect();
        $this->initialize();
    }

    private function initialize(): void
    {
        foreach (BiscaSuit::cases() as $suit) {
            foreach (BiscaRank::cases() as $rank) {
                // In standard 40-card deck, we use all ranks defined in our Enum.
                // Our Enum BiscaRank only includes 2,3,4,5,6,Q,J,K,7,A.
                // It does NOT include 8, 9, 10 (numeric).
                // So simply iterating the Enum is sufficient as long as the Enum is correct.
                $this->cards->push(new Card($suit, $rank));
            }
        }
    }

    public function shuffle(): void
    {
        $this->cards = $this->cards->shuffle();
    }

    public function draw(): ?Card
    {
        return $this->cards->pop();
    }

    public function count(): int
    {
        return $this->cards->count();
    }

    public function getCards(): Collection
    {
        return $this->cards;
    }
}
