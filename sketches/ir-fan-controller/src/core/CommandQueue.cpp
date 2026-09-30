#include "CommandQueue.h"

bool CommandQueue::push(const Command& cmd) {
  remember(cmd.id);
  if (size_ == CAPACITY) return false;

  // Insertion sort by issue time: snapshots can arrive in any key order.
  size_t i = size_;
  while (i > 0 && items_[i - 1].issuedAt > cmd.issuedAt) {
    items_[i] = items_[i - 1];
    --i;
  }
  items_[i] = cmd;
  ++size_;
  return true;
}

Command CommandQueue::pop() {
  Command head = items_[0];
  for (size_t i = 1; i < size_; ++i) items_[i - 1] = items_[i];
  items_[--size_] = Command();
  return head;
}

bool CommandQueue::hasSeen(const String& id) const {
  for (const String& seen : recent_) {
    if (seen == id) return true;
  }
  return false;
}

bool CommandQueue::isQueued(const String& id) const {
  for (size_t i = 0; i < size_; ++i) {
    if (items_[i].id == id) return true;
  }
  return false;
}

void CommandQueue::remember(const String& id) {
  if (hasSeen(id)) return;
  recent_[recentNext_] = id;
  recentNext_ = (recentNext_ + 1) % RECENT_CAPACITY;
}
