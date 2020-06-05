/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.apache.myfaces.tobago.internal.config;

import org.junit.Assert;
import org.junit.Test;
import org.xml.sax.SAXException;

import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class TobagoConfigMergingUnitTest {

  @Test
  public void testPreventFrameAttacksCascadingDefault()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml",
        "tobago-config-merge-1.xml");

    Assert.assertFalse(config.isPreventFrameAttacks());
  }

  @Test
  public void testPreventFrameAttacks()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge("tobago-config-merge-0.xml");

    Assert.assertFalse(config.isPreventFrameAttacks());
  }

  @Test
  public void testPreventFrameAttacksDefault()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge("tobago-config-merge-1.xml");

    Assert.assertTrue(config.isPreventFrameAttacks());
  }

  @Test
  public void testContentSecurityPolicy()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml");

    Assert.assertSame(config.getContentSecurityPolicy().getMode(), ContentSecurityPolicy.Mode.ON);
    final Map<String, String> directiveMap = config.getContentSecurityPolicy().getDirectiveMap();
    Assert.assertEquals(1, directiveMap.size());
    Assert.assertEquals("'self'", directiveMap.get("default-src"));
  }

  @Test
  public void testContentSecurityPolicyExtend()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml",
        "tobago-config-merge-1.xml");

    Assert.assertSame(config.getContentSecurityPolicy().getMode(), ContentSecurityPolicy.Mode.REPORT_ONLY);
    final Map<String, String> directiveMap = config.getContentSecurityPolicy().getDirectiveMap();
    Assert.assertEquals(2, directiveMap.size());
    Assert.assertEquals("'self'", directiveMap.get("default-src"));
    Assert.assertEquals("http://apache.org", directiveMap.get("image-src"));
  }

  @Test
  public void testContentSecurityPolicyOff()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml",
        "tobago-config-merge-1.xml",
        "tobago-config-merge-2.xml");

    Assert.assertSame(config.getContentSecurityPolicy().getMode(), ContentSecurityPolicy.Mode.OFF);
    Assert.assertEquals(2, config.getContentSecurityPolicy().getDirectiveMap().size());
  }

  @Test
  public void testContentSecurityPolicyNameAttribute()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml",
        "tobago-config-merge-3.xml");

    Assert.assertSame(config.getContentSecurityPolicy().getMode(), ContentSecurityPolicy.Mode.ON);
    final Map<String, String> directiveMap = config.getContentSecurityPolicy().getDirectiveMap();
    Assert.assertEquals(1, directiveMap.size());
    Assert.assertEquals("'self' https:", directiveMap.get("default-src"));
  }

  @Test
  public void testMimeTypes()
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final TobagoConfigImpl config = loadAndMerge(
        "tobago-config-merge-0.xml",
        "tobago-config-merge-1.xml",
        "tobago-config-merge-2.xml");

    final Map<String, String> mimeTypes = config.getMimeTypes();
    Assert.assertEquals(3, mimeTypes.size());
    Assert.assertEquals("test/one", mimeTypes.get("test-1"));
    Assert.assertEquals("test/zwei", mimeTypes.get("test-2"));
    Assert.assertEquals("test/three", mimeTypes.get("test-3"));
  }

  public static TobagoConfigImpl loadAndMerge(final String... names)
      throws IOException, SAXException, ParserConfigurationException, URISyntaxException {

    final List<TobagoConfigFragment> list = new ArrayList<>();

    for (final String name : names) {
      final URL url = TobagoConfigMergingUnitTest.class.getClassLoader().getResource(name);
      final TobagoConfigParser parser = new TobagoConfigParser();
      list.add(parser.parse(url));
    }

    final TobagoConfigSorter sorter = new TobagoConfigSorter(list);
    final TobagoConfigMerger merger = new TobagoConfigMerger(sorter.topologicalSort());
    return merger.merge();
  }
}
