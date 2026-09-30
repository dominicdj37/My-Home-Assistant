#pragma once

#include "Command.h"

// Small fixed-size queue of commands waiting to be executed, ordered by
// issue time. Also remembers recently seen ids so a command that is
// delivered again is never executed twice. That happens when the stream
// reconnects before a deletion lands, or when a phone retries a write the
// server already accepted (the retry re-creates the command after we
// deleted it).
class CommandQueue {
 public:
  static constexpr size_t CAPACITY = 8;

  // Returns false if the queue is full. Remembers the id either way.
  bool push(const Command& cmd);
  bool isEmpty() const { return size_ == 0; }
  Command pop();

  // Marks an id as handled without queueing it (e.g. rejected commands).
  void remember(const String& id);
  // True if this id was queued, handled or rejected recently.
  bool hasSeen(const String& id) const;
  // True if this id is still waiting in the queue.
  bool isQueued(const String& id) const;

 private:

  Command items_[CAPACITY];
  size_t size_ = 0;

  static constexpr size_t RECENT_CAPACITY = 16;
  String recent_[RECENT_CAPACITY];
  size_t recentNext_ = 0;
};
