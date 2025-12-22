<?php

namespace App\Game;

use Illuminate\Support\Collection;

class BiscaGameState
{
    public Deck $deck;
    public Card $trumpCard;

    /** @var Collection<int, Card> */
    public Collection $player1Hand;

    /** @var Collection<int, Card> */
    public Collection $player2Hand;

    /** @var Collection<int, Card> */
    public Collection $player1Pile;

    /** @var Collection<int, Card> */
    public Collection $player2Pile;

    public int $playerTurn; // 1 or 2
    public ?Card $tableCard = null; // Card currently on the table (played by first player)

    // Game settings
    public int $gameType; // 3 or 9

    public function __construct(int $gameType = 9) // Default to Bisca de 9
    {
        $this->gameType = $gameType;
        $this->deck = new Deck();
        $this->player1Hand = collect();
        $this->player2Hand = collect();
        $this->player1Pile = collect();
        $this->player2Pile = collect();

        $this->playerTurn = 1; // Default, should be randomized or set externally
    }

    public function start(): void
    {
        $this->deck->shuffle();

        // Draw Trump: "Last card ... is turned face up ... remaining cards on top"
        // In code, we can just peek the last card or draw it and save it.
        // Let's say the 'bottom' card is the trump.
        // Since our deck implies 'draw' pops from stack, let's say the first card we set aside is trump.
        // Or strictly following rule: "Last card ... turned face up".
        // Let's shuffle, pick the last one as trump.
        // For simplicity in array logic: Let's pick a random card as trump before filling deck?
        // No, Deck class handles 40 cards.
        // We can just take the *first* card (bottom) as trump and move it to a special property, 
        // effectively removing it from the draw pile until the end?
        // Rule: "leaving part of the trump visible".

        // Implementation: 
        // 1. Shuffle.
        // 2. Determine trump (e.g. the last card in the collection).
        // 3. Deal hands.

        $cards = $this->deck->getCards();
        $this->trumpCard = $cards->last();
        // Note: In real valid Bisca, you deal hands FIRST, then turn the next card as trump?
        // Rule: "Each player is dealt nine cards... The last card of the deck is turned face up".
        // Use Deck->draw to deal.

        $cardsToDeal = ($this->gameType === 3) ? 3 : 9;

        for ($i = 0; $i < $cardsToDeal; $i++) {
            $this->player1Hand->push($this->deck->draw());
            $this->player2Hand->push($this->deck->draw());
        }

        // Now defining trump from the "next" card or the literal last?
        // "The last card of the deck is turned face up... remaining cards are placed face down on top of that card"
        // This implies the Trump is the Bottom card of the draw pile. 
        // So after dealing, the deck contains N cards. The "Bottom" one is Trump.
        // Our Deck::draw() pops from end? Or beginning? 
        // Collection::pop() takes from end.
        // Let's assume index 0 is bottom.
        $this->trumpCard = $this->deck->getCards()->first();
    }

    public function getPlayerPoints(int $player): int
    {
        $pile = ($player === 1) ? $this->player1Pile : $this->player2Pile;
        return $pile->sum(fn(Card $c) => $c->getPoints());
    }

    public function isDeckEmpty(): bool
    {
        return $this->deck->count() === 0;
    }

    public function isGameOver(): bool
    {
        return $this->isDeckEmpty() && $this->player1Hand->isEmpty() && $this->player2Hand->isEmpty();
    }
}
