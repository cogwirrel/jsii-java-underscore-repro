package org.acme;

public class Main {
  public static void main(final String[] args) {
    System.out.println(new jack.test.underscores.my_namespace_with_underscores.Hello().sayHello());
    System.out.println(new jack.test.nounderscores.mynamespacewithnounderscores.Hello().sayHello());
  }
}
