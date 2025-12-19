<?php

namespace App\Enums;

enum MatchEnum: string
{
    case PENDING = 'Pending';
    case PLAYING = 'Playing';
    case ENDED = 'Finished';
    case INTERRUPTED = 'Interrupted';
}
