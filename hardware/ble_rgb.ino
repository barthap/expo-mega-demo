#include <Arduino.h>
#include <SoftwareSerial.h>
#include <TimerOne.h>
#include "SerialCommands.h"


SoftwareSerial bleSerial(2,4); // RX, TX

int r_pin = 3;
int g_pin = 5;
int b_pin = 6;

volatile uint8_t current_r, current_g, current_b;
volatile uint8_t target_r, target_g, target_b;


char serialCommandBuffer[32];
SerialCommands serialCommands(&bleSerial, serialCommandBuffer, sizeof(serialCommandBuffer), "\r\n", " ");

void cmdUnrecognized(SerialCommands* sender, const char* cmd)
{
  Serial.print("Unrecognized command: ");
  Serial.println(cmd);
}

// directly
void writeRGB(uint8_t r, uint8_t g, uint8_t b) {
  current_r = r;
  current_g = g;
  current_b = b;
  
  analogWrite(r_pin, 255-r);
  analogWrite(g_pin, 255-g);
  analogWrite(b_pin, 255-b);
}

// With fade
void setRGB(uint8_t r, uint8_t g, uint8_t b) {
  target_r = r;
  target_g = g;
  target_b = b;
}

// Called every 1ms - it takes ~0.25s to fade from black to white
void updateFades() {
  if      (target_r > current_r) current_r++;
  else if (target_r < current_r) current_r--;

  if      (target_g > current_g) current_g++;
  else if (target_g < current_g) current_g--;

  if      (target_b > current_b) current_b++;
  else if (target_b < current_b) current_b--;

  analogWrite(r_pin, 255-current_r);
  analogWrite(g_pin, 255-current_g);
  analogWrite(b_pin, 255-current_b);
}

// called when received "RGB xxx yyy zzz" command
void cmdLedRgbFn(SerialCommands* sender)
{
  char* led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
    return;
  }
  uint8_t r = atoi(led_str);

  led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
    return;
  }
  uint8_t g = atoi(led_str);

  led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
    return;
  }
  uint8_t b = atoi(led_str);

  Serial.print("RGB ");
  Serial.print(r);
  Serial.print(" ");
  Serial.print(g);
  Serial.print(" ");
  Serial.println(b);
  setRGB(r, g, b);
}

SerialCommand cmdRgbLed("RGB", cmdLedRgbFn);

void setup()
{
  Serial.begin(115200);
  while (!Serial);

  Serial.println("Hello World!");

  // the HM-10 module by default uses 9600 baud
  bleSerial.begin(9600);
  while (!bleSerial);

  serialCommands.SetDefaultHandler(cmdUnrecognized);
  serialCommands.AddCommand(&cmdRgbLed);

  // simple start-up animation
  writeRGB(255,0,0);
  delay(500);
  writeRGB(0,255,0);
  delay(500);
  writeRGB(0,0,255);
  delay(500);
  writeRGB(255,255,255);

  // Run every 1000 microseconds = 1kHz
  Timer1.initialize(1000); 
  Timer1.attachInterrupt(updateFades);
}

void loop()
{
  serialCommands.ReadSerial();

  // passthrough PC --> Bluetooth serial data
  if (Serial.available())
    bleSerial.write(Serial.read());
}
